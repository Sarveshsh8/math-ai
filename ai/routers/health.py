import os
import sympy
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "model": os.getenv("MODEL_ID", "Qwen/Qwen2.5-Math-1.5B-Instruct"),
        "sympy": sympy.__version__,
    }
