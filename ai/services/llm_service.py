"""
LLM service — loads Qwen2.5-Math-1.5B-Instruct once at startup.
All generation is synchronous with threading so FastAPI's async
event loop is not blocked.
"""
import os
from threading import Thread
from typing import Iterator

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer

from models.responses import SympyResult

MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen2.5-Math-1.5B-Instruct")

_tokenizer: AutoTokenizer | None = None
_model: AutoModelForCausalLM | None = None


def load_model() -> None:
    """Called once at app startup. Downloads weights on first run (~3GB)."""
    global _tokenizer, _model
    print(f"[LLM] Loading {MODEL_ID}...")

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

    # device_map="auto": MPS on Apple Silicon, CUDA if available, else CPU
    _model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16,
        device_map="auto",
    )
    _model.eval()
    print(f"[LLM] Model loaded on {next(_model.parameters()).device}")


SYSTEM_PROMPT = """\
You are a friendly, encouraging math tutor for high school students (grades 9-12).
Your job is to explain math solutions in clear, student-friendly language.

Rules:
- The correct answer has already been computed. You only EXPLAIN it — never recompute.
- Format all math using LaTeX: inline with $...$ and display with $$...$$.
- Break explanations into clear numbered steps.
- Use simple language. Avoid jargon. Use analogies when helpful.
- Keep it concise — 3 to 6 steps maximum.
- End with a one-line "Key takeaway:" summary.
"""


def _build_messages(system: str, user: str) -> list[dict]:
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _apply_chat_template(messages: list[dict]) -> str:
    assert _tokenizer is not None
    return _tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )


def _generate_stream(prompt: str, max_new_tokens: int = 512) -> Iterator[str]:
    assert _tokenizer is not None and _model is not None

    streamer = TextIteratorStreamer(
        _tokenizer,
        skip_prompt=True,
        skip_special_tokens=True,
    )
    inputs = _tokenizer(prompt, return_tensors="pt").to(_model.device)

    gen_kwargs = {
        **inputs,
        "streamer": streamer,
        "max_new_tokens": max_new_tokens,
        "temperature": 0.4,
        "do_sample": True,
        "repetition_penalty": 1.1,
    }

    thread = Thread(target=_model.generate, kwargs=gen_kwargs, daemon=True)
    thread.start()

    for token in streamer:
        yield token

    thread.join()


def _generate(prompt: str, max_new_tokens: int = 256) -> str:
    return "".join(_generate_stream(prompt, max_new_tokens))


# ── Public API ────────────────────────────────────────────────────────────────

def stream_explanation(sympy_result: SympyResult, original_problem: str) -> Iterator[str]:
    """Stream a step-by-step explanation of a SymPy-computed result."""
    user_msg = (
        f"Problem: {original_problem}\n\n"
        f"The correct answer (already computed): ${sympy_result.latex_result}$\n\n"
        f"Computation steps from SymPy: {'; '.join(sympy_result.steps)}\n\n"
        "Please explain this solution step-by-step for a high school student."
    )
    prompt = _apply_chat_template(_build_messages(SYSTEM_PROMPT, user_msg))
    yield from _generate_stream(prompt, max_new_tokens=512)


def stream_feedback(
    problem: str,
    student_answer: str,
    correct_answer: str,
    topic: str,
) -> Iterator[str]:
    """Stream targeted feedback on a student's practice answer."""
    user_msg = (
        f"Topic: {topic}\n"
        f"Problem: {problem}\n"
        f"Correct answer: ${correct_answer}$\n"
        f"Student's answer: {student_answer}\n\n"
        "Grade this answer and give targeted feedback. "
        "If wrong, identify the specific mistake and explain the correct approach. "
        "Be encouraging but precise."
    )
    prompt = _apply_chat_template(_build_messages(SYSTEM_PROMPT, user_msg))
    yield from _generate_stream(prompt, max_new_tokens=384)


def generate_practice_problem(topic: str, difficulty: str, weak_areas: list[str]) -> str:
    """Non-streaming: generate a practice problem."""
    focus = f" Focus on: {', '.join(weak_areas)}." if weak_areas else ""
    user_msg = (
        f"Generate a {difficulty} {topic} problem for a high school student.{focus}\n"
        "Return ONLY the problem statement formatted in LaTeX (use $...$ for math). "
        "Do not include the solution."
    )
    prompt = _apply_chat_template(_build_messages(SYSTEM_PROMPT, user_msg))
    return _generate(prompt, max_new_tokens=128).strip()
