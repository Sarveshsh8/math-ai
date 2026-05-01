import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models.requests import SolveRequest
from services import sympy_service, llm_service

router = APIRouter()


@router.post("/solve")
async def solve(req: SolveRequest):
    sympy_result = sympy_service.solve_problem(req.problem)
    viz_hint = sympy_service.detect_visualization(sympy_result)

    async def generate():
        # First event: metadata (answer renders immediately on frontend)
        meta = {
            "type": "metadata",
            "sympy_result": sympy_result.model_dump(),
            "viz_hint": viz_hint.model_dump() if viz_hint else None,
        }
        yield f"data: {json.dumps(meta)}\n\n"

        # Stream explanation tokens
        for chunk in llm_service.stream_explanation(sympy_result, req.problem):
            yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
