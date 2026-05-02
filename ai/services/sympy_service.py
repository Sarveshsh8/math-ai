import re
from sympy import (
    symbols, diff, integrate, solve, simplify,
    latex, sympify, sin, cos, tan, pi, E,
)
from sympy.parsing.sympy_parser import (
    parse_expr, standard_transformations, implicit_multiplication_application,
    convert_xor
)
from sympy.parsing.latex import parse_latex
from models.responses import SympyResult, VizHint, PracticeGradeResult
from config import settings

x = symbols('x')
MAX_POWER_ABS = 100
MAX_STRUCTURAL_TOKENS = 120
_TRANSFORMS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)
_LOCAL_DICT = {
    'x': x,
    'pi': pi,
    'e': E,
    'E': E,
    'sin': sin,
    'cos': cos,
    'tan': tan,
}


def _parse(expr_str: str):
    """Try plain parser first, then LaTeX fallback."""
    clean = _normalize_math_text(expr_str)
    if not _is_safe_math_input(clean):
        return None
    try:
        return parse_expr(clean, transformations=_TRANSFORMS, local_dict=_LOCAL_DICT)
    except Exception:
        try:
            return parse_latex(clean)
        except Exception:
            latexish = _latexish_to_plain(clean)
            try:
                return parse_expr(latexish, transformations=_TRANSFORMS, local_dict=_LOCAL_DICT)
            except Exception:
                return None


def _normalize_math_text(expr_str: str) -> str:
    clean = expr_str.strip().strip('$').strip()
    clean = clean.replace('−', '-').replace('·', '*')
    clean = re.sub(r"\\boxed\{(.+)\}", r"\1", clean)
    clean = re.sub(r"\b(final answer|answer)\s*:?", "", clean, flags=re.IGNORECASE).strip()
    return clean


def _is_safe_math_input(expr_str: str) -> bool:
    if len(expr_str) > settings.max_problem_chars:
        return False
    if len(re.findall(r"[()+\-*/^=]", expr_str)) > MAX_STRUCTURAL_TOKENS:
        return False
    for power in re.findall(r"(?:\*\*|\^)\s*\(?\s*(-?\d+)", expr_str):
        try:
            if abs(int(power)) > MAX_POWER_ABS:
                return False
        except ValueError:
            return False
    return True


def _latexish_to_plain(expr_str: str) -> str:
    """Best-effort support for common student-facing LaTeX without new deps."""
    clean = _normalize_math_text(expr_str)
    clean = clean.replace(r"\left", "").replace(r"\right", "")
    clean = clean.replace(r"\cdot", "*").replace(r"\times", "*")
    clean = clean.replace(r"\pi", "pi")
    for name in ["sin", "cos", "tan", "sqrt", "log", "exp"]:
        clean = clean.replace(f"\\{name}", name)
    while True:
        updated = re.sub(r"\\frac\{([^{}]+)\}\{([^{}]+)\}", r"(\1)/(\2)", clean)
        if updated == clean:
            break
        clean = updated
    clean = re.sub(r"\^\{([^{}]+)\}", r"**(\1)", clean)
    clean = re.sub(r"\^([A-Za-z0-9]+)", r"**\1", clean)
    clean = clean.replace("{", "(").replace("}", ")")
    return clean


def _strip_answer_wrappers(answer: str) -> str:
    clean = _normalize_math_text(answer)
    clean = re.sub(r"\+\s*C\b", "", clean)
    clean = re.sub(r"\+\s*\\?mathrm\{?C\}?", "", clean)
    if "=" in clean:
        clean = clean.split("=", 1)[1]
    return clean.strip()


def _parse_answer_set(answer: str):
    clean = _strip_answer_wrappers(answer).strip("[](){} ")
    if "," not in clean:
        return None

    parsed = []
    for part in clean.split(","):
        expr = _parse(part)
        if expr is None:
            return None
        parsed.append(expr)
    return parsed


def _same_expr(left, right) -> bool:
    try:
        return simplify(left - right) == 0
    except Exception:
        return False


def _same_expr_set(left: list, right: list) -> bool:
    if len(left) != len(right):
        return False

    unmatched = list(right)
    for left_expr in left:
        match_idx = next(
            (idx for idx, right_expr in enumerate(unmatched) if _same_expr(left_expr, right_expr)),
            None,
        )
        if match_idx is None:
            return False
        unmatched.pop(match_idx)
    return not unmatched


def _to_latex(expr) -> str:
    try:
        return latex(expr)
    except Exception:
        return str(expr)


def _detect_type(problem: str) -> str:
    p = problem.lower()
    if any(k in p for k in ["d/dx", "derivative", "differentiat", "d dx", "diff"]):
        return "derivative"
    if any(k in p for k in ["∫", "integral", "integrat", "antiderivative", r"\int"]):
        return "integral"
    if "=" in p and any(k in p for k in ["solve", "find x", "roots", "zeros"]):
        return "equation"
    if any(k in p for k in ["simplify", "factor", "expand"]):
        return "simplify"
    return "unknown"


def _extract_expr(problem: str) -> str:
    """Pull the math expression from a natural-language problem string."""
    p = problem.strip()
    # remove common prefixes
    for prefix in [
        r"find the derivative of", r"differentiate", r"d/dx\[?", r"d/dx",
        r"integrate", r"find the integral of", r"∫", r"simplify", r"factor", r"expand",
        r"solve", r"find x",
    ]:
        p = re.sub(prefix, '', p, flags=re.IGNORECASE).strip()
    p = p.strip("[]").strip()
    if p.startswith("(") and p.endswith(")"):
        p = p[1:-1].strip()
    return p or problem.strip()


def solve_problem(problem: str) -> SympyResult:
    kind = _detect_type(problem)
    raw_expr = _extract_expr(problem)

    if kind == "equation":
        try:
            parts = raw_expr.split("=")
            lhs = _parse(parts[0]) if len(parts) >= 1 else None
            rhs = _parse(parts[1]) if len(parts) >= 2 else sympify(0)
            if lhs is None or rhs is None:
                raise ValueError("Could not parse equation")

            solutions = solve(lhs - rhs, x)
            sol_latex = ", ".join(_to_latex(s) for s in solutions) if solutions else "\\text{No solutions}"
            return SympyResult(
                type="equation",
                input_expr=raw_expr,
                result_expr=str(solutions),
                latex_result=f"x = {sol_latex}",
                steps=[
                    "Move all terms to one side",
                    "Factor or use quadratic formula",
                    f"Solutions: x = {sol_latex}",
                ],
            )
        except Exception as e:
            return SympyResult(
                type="unknown",
                input_expr=raw_expr,
                result_expr="?",
                latex_result="?",
                steps=[f"SymPy error: {e}"],
            )

    sym_expr = _parse(raw_expr)

    if sym_expr is None:
        return SympyResult(
            type="unknown",
            input_expr=raw_expr,
            result_expr="?",
            latex_result="?",
            steps=["Could not parse expression. Try simpler notation like x^2 + sin(x)."],
        )

    try:
        if kind == "derivative":
            result = diff(sym_expr, x)
            steps = _derivative_steps(sym_expr)
            return SympyResult(
                type="derivative",
                input_expr=raw_expr,
                result_expr=str(result),
                latex_result=_to_latex(result),
                steps=steps,
            )

        if kind == "integral":
            result = integrate(sym_expr, x)
            steps = [
                f"Integrate term by term",
                f"Apply power/standard integral rules",
                f"Add constant of integration C",
            ]
            return SympyResult(
                type="integral",
                input_expr=raw_expr,
                result_expr=str(result),
                latex_result=_to_latex(result) + " + C",
                steps=steps,
            )

        # default: simplify
        result = simplify(sym_expr)
        return SympyResult(
            type="simplify",
            input_expr=raw_expr,
            result_expr=str(result),
            latex_result=_to_latex(result),
            steps=["Apply algebraic simplification rules"],
        )

    except Exception as e:
        return SympyResult(
            type="unknown",
            input_expr=raw_expr,
            result_expr="?",
            latex_result="?",
            steps=[f"SymPy error: {e}"],
        )


def grade_answer(student_answer: str, correct_answer: str) -> PracticeGradeResult:
    student_set = _parse_answer_set(student_answer)
    correct_set = _parse_answer_set(correct_answer)
    if student_set is not None or correct_set is not None:
        if student_set is None or correct_set is None:
            is_correct = False
        else:
            is_correct = _same_expr_set(student_set, correct_set)

        message = (
            "Correct. Your solution set matches the expected result."
            if is_correct
            else "Not quite. Your solution set does not match the expected result."
        )
        return PracticeGradeResult(
            is_correct=is_correct,
            method="symbolic",
            message=message,
        )

    student_expr = _parse(_strip_answer_wrappers(student_answer))
    correct_expr = _parse(_strip_answer_wrappers(correct_answer))

    if student_expr is None or correct_expr is None:
        return PracticeGradeResult(
            is_correct=False,
            method="unparseable",
            message="I could not parse one of the answers reliably, so I cannot certify it as correct.",
        )

    try:
        is_correct = _same_expr(student_expr, correct_expr)
    except Exception:
        is_correct = False

    if is_correct:
        message = "Correct. Your answer is symbolically equivalent to the expected result."
    else:
        message = "Not quite. Your answer is not symbolically equivalent to the expected result."

    return PracticeGradeResult(
        is_correct=is_correct,
        method="symbolic",
        message=message,
    )


def _derivative_steps(expr) -> list[str]:
    """Generate human-readable derivative step descriptions."""
    from sympy import Add, Mul, Pow, sin as Sin, cos as Cos, tan as Tan, log, exp
    steps = []
    if isinstance(expr, Add):
        steps.append("Sum rule: differentiate each term separately")
        for term in expr.args:
            steps.append(f"  → d/dx[{_to_latex(term)}]")
    elif isinstance(expr, Mul):
        steps.append("Product rule: d/dx[u·v] = u′v + uv′")
    elif isinstance(expr, Pow):
        base, exp_ = expr.args
        if base == x:
            steps.append(f"Power rule: d/dx[x^{exp_}] = {exp_}·x^{exp_ - 1}")
    if not steps:
        steps = ["Apply standard differentiation rules"]
    return steps


def detect_visualization(result: SympyResult) -> VizHint | None:
    """Map a SymPy result to the best frontend visualizer."""
    if result.type == "derivative":
        return VizHint(type="derivative_explorer", expression=result.input_expr)
    if result.type == "integral":
        # Try to extract integration bounds from expression string
        return VizHint(type="integral_visualizer", expression=result.input_expr, a=0, b=2)
    if result.type == "equation":
        return VizHint(type="function_graph", expression=result.input_expr.split("=")[0])
    # Check if expression involves trig
    if any(k in result.input_expr.lower() for k in ["sin", "cos", "tan"]):
        return VizHint(type="unit_circle")
    if result.type == "simplify":
        return VizHint(type="function_graph", expression=result.input_expr)
    return None
