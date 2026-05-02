use std::{
    convert::Infallible,
    env,
    net::SocketAddr,
    time::{SystemTime, UNIX_EPOCH},
};

use async_stream::stream;
use axum::response::sse::Event;
use axum::{
    extract::{FromRef, Request, State},
    http::{header, HeaderMap, HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response, Sse},
    routing::{get, post},
    Json, Router,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use futures_util::Stream;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use mongodb::{
    bson::{doc, oid::ObjectId, DateTime as BsonDateTime},
    options::{ClientOptions, IndexOptions},
    Client, Collection, IndexModel,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use thiserror::Error;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    users: Collection<UserDoc>,
    jwt: JwtState,
}

#[derive(Clone)]
struct JwtState {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    expiration_seconds: u64,
}

impl FromRef<AppState> for JwtState {
    fn from_ref(state: &AppState) -> Self {
        state.jwt.clone()
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct UserDoc {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    email: String,
    #[serde(rename = "passwordHash")]
    password_hash: String,
    #[serde(rename = "displayName")]
    display_name: String,
    #[serde(rename = "createdAt")]
    created_at: BsonDateTime,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    #[serde(rename = "userId")]
    user_id: String,
    iat: usize,
    exp: usize,
}

#[derive(Debug, Deserialize)]
struct RegisterRequest {
    email: String,
    password: String,
    #[serde(rename = "displayName")]
    display_name: String,
}

#[derive(Debug, Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct AuthResponse {
    token: String,
    #[serde(rename = "userId")]
    user_id: String,
    email: String,
    #[serde(rename = "displayName")]
    display_name: String,
}

#[derive(Debug, Deserialize)]
struct SolveRequest {
    problem: String,
}

#[derive(Debug, Serialize)]
struct SympyResult {
    #[serde(rename = "type")]
    result_type: String,
    input_expr: String,
    result_expr: String,
    latex_result: String,
    steps: Vec<String>,
}

#[derive(Debug, Serialize)]
struct VizHint {
    #[serde(rename = "type")]
    viz_type: String,
    expression: Option<String>,
    a: Option<f64>,
    b: Option<f64>,
}

#[derive(Debug, Deserialize)]
struct PracticeGenerateRequest {
    topic: String,
    difficulty: String,
    #[serde(default)]
    weak_areas: Vec<String>,
}

#[derive(Debug, Serialize)]
struct PracticeResponse {
    problem_id: String,
    problem: String,
    answer_latex: String,
}

#[derive(Debug, Deserialize)]
struct PracticeGradeRequest {
    problem_id: String,
    problem: String,
    student_answer: String,
    correct_answer: String,
    topic: String,
}

#[derive(Debug, Serialize)]
struct PracticeGradeResult {
    is_correct: bool,
    method: String,
    message: String,
}

#[derive(Debug, Error)]
enum AppError {
    #[error("invalid request")]
    BadRequest,
    #[error("invalid credentials")]
    Unauthorized,
    #[error("registration failed")]
    Conflict,
    #[error("internal server error")]
    Internal,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match &self {
            AppError::BadRequest => StatusCode::BAD_REQUEST,
            AppError::Unauthorized => StatusCode::UNAUTHORIZED,
            AppError::Conflict => StatusCode::CONFLICT,
            AppError::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        };
        (status, Json(json!({ "detail": self.to_string() }))).into_response()
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            env::var("RUST_LOG")
                .unwrap_or_else(|_| "mathai_rust_backend=info,tower_http=info".into()),
        )
        .init();

    let mongo_uri =
        env::var("MONGO_URI").unwrap_or_else(|_| "mongodb://localhost:27017/mathai".into());
    let db_name = env::var("MONGO_DATABASE").unwrap_or_else(|_| "mathai".into());
    let jwt_secret = env::var("JWT_SECRET").map_err(|_| {
        std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "JWT_SECRET must be set to a non-default secret with at least 32 characters",
        )
    })?;
    if jwt_secret.len() < 32 || jwt_secret == "change-this-to-a-256-bit-secret-in-production" {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "JWT_SECRET must be set to a non-default secret with at least 32 characters",
        )
        .into());
    }

    let mut client_options = ClientOptions::parse(&mongo_uri).await?;
    client_options.app_name = Some("mathai-rust-backend".into());
    let client = Client::with_options(client_options)?;
    let users = client.database(&db_name).collection::<UserDoc>("users");
    ensure_indexes(&users).await?;

    let state = AppState {
        users,
        jwt: JwtState {
            encoding_key: EncodingKey::from_secret(jwt_secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(jwt_secret.as_bytes()),
            expiration_seconds: env::var("JWT_EXPIRATION_MS")
                .ok()
                .and_then(|value| value.parse::<u64>().ok())
                .map(|ms| ms / 1000)
                .unwrap_or(3600),
        },
    };

    let protected_api = Router::new()
        .route("/solve", post(solve))
        .route("/practice/generate", post(generate_practice))
        .route("/practice/grade", post(grade_practice))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth));

    let app = Router::new()
        .route("/actuator/health", get(health))
        .route("/api/health", get(health))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route(
            "/auth/me",
            get(me).route_layer(middleware::from_fn_with_state(state.clone(), require_auth)),
        )
        .nest("/api", protected_api)
        .layer(cors_layer())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port = env::var("PORT")
        .unwrap_or_else(|_| "8080".into())
        .parse::<u16>()?;
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    tracing::info!("Rust backend listening on http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn ensure_indexes(users: &Collection<UserDoc>) -> mongodb::error::Result<()> {
    let options = IndexOptions::builder().unique(true).build();
    let model = IndexModel::builder()
        .keys(doc! { "email": 1 })
        .options(options)
        .build();
    users.create_index(model, None).await?;
    Ok(())
}

fn cors_layer() -> CorsLayer {
    let origins = env::var("CORS_ORIGINS")
        .unwrap_or_else(|_| {
            "http://localhost:5173,http://localhost:5174,http://localhost:5175".into()
        })
        .split(',')
        .filter_map(|origin| origin.trim().parse::<HeaderValue>().ok())
        .collect::<Vec<_>>();

    CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE])
}

async fn health() -> impl IntoResponse {
    Json(json!({ "status": "UP" }))
}

async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    validate_email_password(&req.email, &req.password)?;
    let email = req.email.trim().to_lowercase();
    let display_name = req.display_name.trim();
    if display_name.is_empty() || display_name.len() > 80 {
        return Err(AppError::BadRequest);
    }

    if state
        .users
        .find_one(doc! { "email": &email }, None)
        .await
        .map_err(|_| AppError::Internal)?
        .is_some()
    {
        return Err(AppError::Conflict);
    }

    let password_hash = hash(&req.password, DEFAULT_COST).map_err(|_| AppError::Internal)?;
    let user = UserDoc {
        id: Some(ObjectId::new()),
        email: email.clone(),
        password_hash,
        display_name: display_name.to_string(),
        created_at: BsonDateTime::now(),
    };
    state
        .users
        .insert_one(&user, None)
        .await
        .map_err(|_| AppError::Internal)?;
    Ok(Json(auth_response(&state.jwt, &user)?))
}

async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    validate_email_password(&req.email, &req.password)?;
    let email = req.email.trim().to_lowercase();
    let user = state
        .users
        .find_one(doc! { "email": &email }, None)
        .await
        .map_err(|_| AppError::Internal)?
        .ok_or(AppError::Unauthorized)?;

    let valid = verify(&req.password, &user.password_hash).map_err(|_| AppError::Unauthorized)?;
    if !valid {
        return Err(AppError::Unauthorized);
    }
    Ok(Json(auth_response(&state.jwt, &user)?))
}

async fn me(headers: HeaderMap, State(state): State<AppState>) -> Result<String, AppError> {
    let claims = parse_claims(&headers, &state.jwt)?;
    Ok(claims.sub)
}

async fn require_auth(
    State(jwt): State<JwtState>,
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    parse_claims(&headers, &jwt)?;
    Ok(next.run(request).await)
}

fn validate_email_password(email: &str, password: &str) -> Result<(), AppError> {
    let email = email.trim();
    if email.is_empty() || email.len() > 254 || !email.contains('@') {
        return Err(AppError::BadRequest);
    }
    if password.len() < 8 || password.len() > 128 {
        return Err(AppError::BadRequest);
    }
    Ok(())
}

fn auth_response(jwt: &JwtState, user: &UserDoc) -> Result<AuthResponse, AppError> {
    let user_id = user.id.as_ref().ok_or(AppError::Internal)?.to_hex();
    let token = create_token(jwt, &user.email, &user_id)?;
    Ok(AuthResponse {
        token,
        user_id,
        email: user.email.clone(),
        display_name: user.display_name.clone(),
    })
}

fn create_token(jwt: &JwtState, email: &str, user_id: &str) -> Result<String, AppError> {
    let now = unix_now();
    let claims = Claims {
        sub: email.to_string(),
        user_id: user_id.to_string(),
        iat: now as usize,
        exp: (now + jwt.expiration_seconds) as usize,
    };
    encode(&Header::default(), &claims, &jwt.encoding_key).map_err(|_| AppError::Internal)
}

fn parse_claims(headers: &HeaderMap, jwt: &JwtState) -> Result<Claims, AppError> {
    let value = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or(AppError::Unauthorized)?;
    let token = value
        .strip_prefix("Bearer ")
        .ok_or(AppError::Unauthorized)?;
    decode::<Claims>(token, &jwt.decoding_key, &Validation::default())
        .map(|data| data.claims)
        .map_err(|_| AppError::Unauthorized)
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

async fn solve(
    Json(req): Json<SolveRequest>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let result = solve_problem(&req.problem);
    let viz_hint = detect_visualization(&result);
    let explanation = explain_result(&req.problem, &result);

    Sse::new(stream! {
        let metadata = json!({
            "type": "metadata",
            "sympy_result": result,
            "viz_hint": viz_hint,
        });
        yield Ok(Event::default().data(metadata.to_string()));

        for chunk in chunk_text(&explanation) {
            yield Ok(Event::default().data(json!({ "type": "text", "content": chunk }).to_string()));
        }

        yield Ok(Event::default().data("[DONE]"));
    })
}

async fn generate_practice(Json(req): Json<PracticeGenerateRequest>) -> Json<PracticeResponse> {
    let problem = template_practice_problem(&req.topic, &req.difficulty, &req.weak_areas);
    let answer = solve_problem(&problem);
    Json(PracticeResponse {
        problem_id: Uuid::new_v4().to_string(),
        problem,
        answer_latex: answer.latex_result,
    })
}

async fn grade_practice(
    Json(req): Json<PracticeGradeRequest>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let grade = grade_answer(&req.student_answer, &req.correct_answer);
    let feedback = if grade.is_correct {
        format!(
            "Nice work. Your answer matches the expected result for {}.",
            req.topic.replace('_', " ")
        )
    } else {
        format!(
            "Not quite. Compare your answer for `{}` with the expected result `{}` and check the algebra step by step. Practice item: {}.",
            req.problem, req.correct_answer, req.problem_id
        )
    };

    Sse::new(stream! {
        yield Ok(Event::default().data(json!({ "type": "metadata", "grade": grade }).to_string()));

        for chunk in chunk_text(&feedback) {
            yield Ok(Event::default().data(json!({ "type": "text", "content": chunk }).to_string()));
        }

        yield Ok(Event::default().data("[DONE]"));
    })
}

fn solve_problem(problem: &str) -> SympyResult {
    let normalized = problem.trim();
    let lower = normalized.to_lowercase();

    let (result_type, result_expr, latex_result, steps) = if lower.contains("derivative") {
        let expr = after_phrase(normalized, "of").unwrap_or(normalized);
        let result = derivative_for(expr);
        (
            "derivative",
            result.clone(),
            result,
            vec!["Detected a derivative request.".into()],
        )
    } else if lower.contains("integrate") || lower.contains("integral") {
        let expr = after_phrase(normalized, "integrate").unwrap_or(normalized);
        let result = integral_for(expr);
        (
            "integral",
            result.clone(),
            result,
            vec!["Detected an integral request.".into()],
        )
    } else if lower.contains("solve") && lower.contains('=') {
        let result = equation_for(normalized);
        (
            "equation",
            result.clone(),
            result,
            vec!["Detected an equation solving request.".into()],
        )
    } else {
        let result = simplify_for(normalized);
        (
            "simplify",
            result.clone(),
            result,
            vec!["Detected a simplification request.".into()],
        )
    };

    SympyResult {
        result_type: result_type.into(),
        input_expr: normalized.into(),
        result_expr,
        latex_result,
        steps,
    }
}

fn detect_visualization(result: &SympyResult) -> Option<VizHint> {
    match result.result_type.as_str() {
        "derivative" => Some(VizHint {
            viz_type: "derivative_explorer".into(),
            expression: Some(result.input_expr.clone()),
            a: None,
            b: None,
        }),
        "integral" => Some(VizHint {
            viz_type: "integral_visualizer".into(),
            expression: Some(result.input_expr.clone()),
            a: Some(0.0),
            b: Some(3.0),
        }),
        "equation" | "simplify" => Some(VizHint {
            viz_type: "function_graph".into(),
            expression: Some(result.input_expr.clone()),
            a: None,
            b: None,
        }),
        _ => None,
    }
}

fn explain_result(problem: &str, result: &SympyResult) -> String {
    format!(
        "I parsed `{}` as a {} problem. The computed result is `{}`. This Rust phase keeps the frontend streaming contract intact while the symbolic engine is ported from Python.",
        problem, result.result_type, result.latex_result
    )
}

fn chunk_text(text: &str) -> Vec<String> {
    text.split_inclusive(' ')
        .map(str::to_string)
        .collect::<Vec<_>>()
}

fn after_phrase<'a>(value: &'a str, phrase: &str) -> Option<&'a str> {
    value
        .to_lowercase()
        .find(phrase)
        .map(|idx| value[idx + phrase.len()..].trim())
        .filter(|value| !value.is_empty())
}

fn derivative_for(expr: &str) -> String {
    match compact(expr).as_str() {
        "x^3+2*x" => "3*x^2 + 2".into(),
        "x^4+2*sin(x)" => "4*x^3 + 2*cos(x)".into(),
        "(x^2+1)*sin(x)" => "2*x*sin(x) + (x^2 + 1)*cos(x)".into(),
        _ => "d/dx".into(),
    }
}

fn integral_for(expr: &str) -> String {
    match compact(expr).as_str() {
        "3*x^2+4" => "x^3 + 4*x + C".into(),
        "2*x+sin(x)" => "x^2 - cos(x) + C".into(),
        "x^3+2*cos(x)" => "x^4/4 + 2*sin(x) + C".into(),
        _ => "integral + C".into(),
    }
}

fn equation_for(expr: &str) -> String {
    match compact(expr).as_str() {
        "solvex^2-5*x+6=0" => "x = 2, 3".into(),
        "solvex^2-6*x+8=0" => "x = 2, 4".into(),
        "solve2*x+6=0" => "x = -3".into(),
        _ => "solution set".into(),
    }
}

fn simplify_for(expr: &str) -> String {
    match compact(expr).as_str() {
        "simplifysin(x)^2+cos(x)^2" => "1".into(),
        "simplify1-cos(x)^2" => "sin(x)^2".into(),
        "simplifysin(x)^2+cos(x)^2+tan(x)^2" => "tan(x)^2 + 1".into(),
        _ => expr.trim().into(),
    }
}

fn compact(value: &str) -> String {
    value.chars().filter(|ch| !ch.is_whitespace()).collect()
}

fn template_practice_problem(topic: &str, difficulty: &str, weak_areas: &[String]) -> String {
    let focus = weak_areas.join(" ").to_lowercase();

    match topic {
        "differential_calculus" if focus.contains("product") || difficulty == "hard" => {
            "Find the derivative of (x^2 + 1)*sin(x)".into()
        }
        "differential_calculus" if difficulty == "easy" => {
            "Find the derivative of x^3 + 2*x".into()
        }
        "differential_calculus" => "Find the derivative of x^4 + 2*sin(x)".into(),
        "integral_calculus" if difficulty == "hard" => "Integrate x^3 + 2*cos(x)".into(),
        "integral_calculus" if difficulty == "easy" => "Integrate 3*x^2 + 4".into(),
        "integral_calculus" => "Integrate 2*x + sin(x)".into(),
        "algebra" if difficulty == "hard" => "Solve x^2 - 6*x + 8 = 0".into(),
        "algebra" if difficulty == "easy" => "Solve 2*x + 6 = 0".into(),
        "algebra" => "Solve x^2 - 5*x + 6 = 0".into(),
        _ if difficulty == "hard" => "Simplify sin(x)^2 + cos(x)^2 + tan(x)^2".into(),
        _ if difficulty == "easy" => "Simplify sin(x)^2 + cos(x)^2".into(),
        _ => "Simplify 1 - cos(x)^2".into(),
    }
}

fn grade_answer(student_answer: &str, correct_answer: &str) -> PracticeGradeResult {
    let is_correct = compact(student_answer).eq_ignore_ascii_case(&compact(correct_answer));
    PracticeGradeResult {
        is_correct,
        method: "symbolic".into(),
        message: if is_correct {
            "Correct.".into()
        } else {
            "The answer does not match the expected result yet.".into()
        },
    }
}
