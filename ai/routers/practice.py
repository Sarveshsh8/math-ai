import json
import uuid
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models.requests import PracticeGenerateRequest, PracticeGradeRequest
from models.responses import PracticeResponse
from services import sympy_service, llm_service

router = APIRouter()


def _template_practice_problem(topic: str, difficulty: str, weak_areas: list[str]) -> str:
    focus = " ".join(weak_areas).lower()

    if topic == "differential_calculus":
        if "product" in focus or difficulty == "hard":
            return r"Find the derivative of (x^2 + 1)*sin(x)"
        if difficulty == "easy":
            return r"Find the derivative of x^3 + 2*x"
        return r"Find the derivative of x^4 + 2*sin(x)"

    if topic == "integral_calculus":
        if difficulty == "hard":
            return r"Integrate x^3 + 2*cos(x)"
        if difficulty == "easy":
            return r"Integrate 3*x^2 + 4"
        return r"Integrate 2*x + sin(x)"

    if topic == "algebra":
        if difficulty == "hard":
            return r"Solve x^2 - 6*x + 8 = 0"
        if difficulty == "easy":
            return r"Solve 2*x + 6 = 0"
        return r"Solve x^2 - 5*x + 6 = 0"

    if difficulty == "hard":
        return r"Simplify sin(x)^2 + cos(x)^2 + tan(x)^2"
    if difficulty == "easy":
        return r"Simplify sin(x)^2 + cos(x)^2"
    return r"Simplify 1 - cos(x)^2"


@router.post("/practice/generate", response_model=PracticeResponse)
async def generate_problem(req: PracticeGenerateRequest):
    problem_text = _template_practice_problem(req.topic, req.difficulty, req.weak_areas)
    # SymPy pre-computes the answer so grading is deterministic
    sympy_result = sympy_service.solve_problem(problem_text)

    return PracticeResponse(
        problem_id=str(uuid.uuid4()),
        problem=problem_text,
        answer_latex=sympy_result.latex_result,
    )


@router.post("/practice/grade")
async def grade_answer(req: PracticeGradeRequest):
    grade_result = sympy_service.grade_answer(req.student_answer, req.correct_answer)

    async def generate():
        yield f"data: {json.dumps({'type': 'metadata', 'grade': grade_result.model_dump()})}\n\n"
        for chunk in llm_service.stream_feedback(
            req.problem,
            req.student_answer,
            req.correct_answer,
            req.topic,
        ):
            yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
