# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Start everything (recommended)
```bash
./start.sh   # sets up venvs, installs deps, starts both servers, Ctrl+C to stop
```

### Spring Boot gateway (Java backend)
```bash
cd backend
./mvnw spring-boot:run          # dev mode, port 8080
./mvnw package -DskipTests      # build fat jar
./mvnw test                     # run tests
```
Requires: Java 24, MongoDB on `localhost:27017`.

### Python AI service
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev        # dev server → http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint
npm run preview    # preview production build
```

## Architecture

### Request flow
```
Frontend :5173 → Spring Boot :8080 (JWT auth + MongoDB) → Python FastAPI :8000 (SymPy + LLM)
```

1. Frontend sends `Authorization: Bearer <jwt>` with every `/api/**` request to Spring Boot `:8080`
2. `JwtFilter` validates the token; unauthenticated requests are rejected before hitting any controller
3. `ProxyController` forwards the request byte-for-byte to Python FastAPI `:8000` (SSE streams pass through without buffering)
4. Python computes math (SymPy) → generates explanation (LLM) → SSE-streams back through Spring Boot to the frontend

Auth endpoints (`/auth/register`, `/auth/login`, `/auth/me`) are handled entirely by Spring Boot and never touch Python.

### Data flow for a solve request
1. User types problem → `HeroInput` → `SolvePage.handleSolve()`
2. `streamSolve()` in `api/client.ts` POSTs to `/api/solve` (hits Spring Boot, proxied to Python)
3. Python: `sympy_service.solve_problem()` computes answer → `detect_visualization()` picks viz → SSE stream emits `metadata` event first, then `text` chunks, then `[DONE]`
4. Frontend: `metadata` event triggers `setState('result')` + renders KaTeX answer instantly; `text` chunks stream through `StreamingText`
5. After stream ends: `PostSolveCTAs` appear; "Try similar" opens `ProblemCard` inline; "Explore" links to `/explore?viz=<type>`

### Key design decisions
- **SymPy owns all math.** LLM only explains pre-computed results — it never recomputes.
- **SSE metadata-first.** The correct answer renders before the LLM produces its first token.
- **Mock mode.** `VITE_USE_MOCK=true` bypasses Spring Boot + Python entirely. `src/mock/responses.ts` has hardcoded data and `simulateStream()`.
- **`PracticeProblum` is a deliberate typo** in `api/client.ts` — matches the backend response shape. Don't fix without updating both sides.
- **`steps[]` is populated but not rendered.** `SympyResult.steps` is filled by `sympy_service` and returned in metadata, but the frontend doesn't display it. Hook for future step-by-step mode.

### Spring Boot backend (`backend/src/main/java/com/mathai/`)
- `controller/AuthController.java` — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `controller/ProxyController.java` — forwards all `/api/**` to Python; SSE and JSON both handled; saves **nothing** to MongoDB (history persistence is not yet wired up)
- `config/SecurityConfig.java` — stateless JWT, all `/api/**` requires auth, `/auth/**` and `/actuator/health` are public
- `security/JwtFilter.java` + `JwtUtil.java` — validates Bearer token on every request
- `model/SolveHistory.java` + `repository/SolveHistoryRepository.java` — MongoDB document for solve history; **exists but is never written to** — gap to fill
- `model/User.java` + `repository/UserRepository.java` — MongoDB user accounts with BCrypt passwords

### Python AI service (`backend/` — legacy paths)
- `main.py` — FastAPI app; model loads once in `lifespan()` context manager
- `config.py` — pydantic-settings from `../.env`; `MODEL_ID` swaps the model
- `services/sympy_service.py` — expression parser (`_parse`: `parse_expr` → `parse_latex` → manual LaTeX fallback), type detector, math dispatcher, `grade_answer()` for symbolic equivalence
- `services/llm_service.py` — Qwen2.5-Math-1.5B-Instruct with `device_map="auto"` (MPS/CUDA/CPU); `TextIteratorStreamer` + `Thread` avoids blocking async loop
- `routers/solve.py` — SSE stream: metadata event → text chunks → `[DONE]`
- `routers/practice.py` — `POST /api/practice/generate`, `POST /api/practice/grade`

### Frontend (`frontend/src/`)
- `types/index.ts` — single source of truth for all shared types (`SolveMetadata`, `VizHint`, `SympyResult`, etc.)
- `mock/responses.ts` — prototype data; `simulateStream()` replays text character-by-character
- `components/shared/StreamingText.tsx` — splits on `$...$` / `$$...$$`; renders math via KaTeX, prose with `**bold**`
- `components/solve/InlineVisualization.tsx` — receives `VizHint`, switches on `type` to render one of five Mafs components
- `components/explore/` — five self-contained Mafs visualizers; all use `mathjs` for client-side evaluation
- Vite proxies `/api/**` → `localhost:8080` (Spring Boot) in dev

### VizHint type → component mapping
| `VizHint.type` | Component | Triggered by |
|---|---|---|
| `derivative_explorer` | `DerivativeExplorer` | derivative problems |
| `integral_visualizer` | `IntegralVisualizer` | integral problems |
| `unit_circle` | `UnitCircle` | trig expressions |
| `trig_wave` | `TrigWaveBuilder` | (manual in Explore) |
| `function_graph` | `FunctionGrapher` | equation / simplify |

### Adding a new visualizer (end-to-end)
1. Add the new `VizType` string to `types/index.ts`
2. Create `components/explore/MyVisualizer.tsx` (Mafs + mathjs pattern)
3. Add a case to `InlineVisualization.tsx` and the Explore page tab
4. In `sympy_service.py`, update `detect_visualization()` to return the new `VizHint`

### Adding a new math operation
1. Add the type string to `SympyResult.type` in `types/index.ts` and `models/responses.py`
2. Implement in `sympy_service.py` — add to `solve_problem()` dispatch and `_detect_type()`
3. Update the LLM prompt in `llm_service.py` if needed

### TweaksContext CSS variables
`TweaksProvider` applies on mount (defaults only — no UI to change them):
- `--accent-h` (45), `--density` (1), `--font-display` (`'Instrument Serif', serif`)
- `variant-studio` body class — studio variant toggle
Consumed by `index.css`, `SolvePage.tsx`, `LandingPage.tsx`.

## Environment variables

### `.env` at repo root (shared)
```
MODEL_ID=Qwen/Qwen2.5-Math-1.5B-Instruct
HF_HOME=~/.cache/huggingface
ALLOWED_ORIGINS=http://localhost:5173
VITE_API_BASE_URL=http://localhost:8080     # points to Spring Boot, not Python directly
VITE_USE_MOCK=true                          # set false to use real backend
```

### Spring Boot (`application.properties`)
```
MONGO_URI=mongodb://localhost:27017/mathai  # default: localhost
JWT_SECRET=<256-bit secret>                 # default is insecure — override in prod
AI_BASE_URL=http://localhost:8000           # Python FastAPI
CORS_ORIGINS=http://localhost:5173,...
```
