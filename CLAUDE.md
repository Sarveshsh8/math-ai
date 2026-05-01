# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Start everything (recommended)
```bash
./start.sh   # sets up venvs, installs deps, starts both servers, Ctrl+C to stop
```

### Backend only
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Frontend only
```bash
cd frontend
npm run dev        # dev server → http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint
```

## Architecture

### Data flow for a solve request
1. User types problem → `HeroInput` → `SolvePage.handleSolve()`
2. `streamSolve()` in `api/client.ts` POSTs to `/api/solve`
3. Backend: `sympy_service.solve_problem()` computes the answer → `detect_visualization()` picks a viz → SSE stream emits `metadata` event first, then `text` chunks, then `[DONE]`
4. Frontend: `metadata` event triggers `setState('result')` + renders KaTeX answer instantly; `text` chunks accumulate in `explanation` state and stream through `StreamingText`
5. After stream ends: `PostSolveCTAs` appear; "Try similar" opens `ProblemCard` inline; "Explore" links to `/explore?viz=<type>`

### Key design decisions
- **SymPy owns all math.** LLM only explains pre-computed results — it never recomputes. This separates correctness (SymPy) from pedagogy (LLM).
- **SSE metadata-first.** The correct answer renders before the LLM produces its first token. UX is instant even when the model is slow.
- **Mock mode.** `VITE_USE_MOCK=true` (set in `.env`) bypasses the backend entirely. `src/mock/responses.ts` has hardcoded data and a `simulateStream()` helper.
- **`PracticeProblum` is a deliberate typo** in `api/client.ts` — matches the backend response shape. Don't fix it without updating both sides.

### Backend (`backend/`)
- `main.py` — FastAPI app; model loads once in `lifespan()` context manager
- `config.py` — pydantic-settings reading from `../.env`; `MODEL_ID` env var swaps the model
- `services/sympy_service.py` — expression parser (`_parse` tries `parse_expr` → `parse_latex` → manual LaTeX→plain fallback), type detector, math dispatcher, `grade_answer()` for symbolic equivalence checking
- `services/llm_service.py` — loads Qwen2.5-Math-1.5B-Instruct with `device_map="auto"` (MPS/CUDA/CPU); uses `TextIteratorStreamer` + `Thread` to avoid blocking the async event loop
- `routers/solve.py` — SSE stream: metadata event → text chunks → `[DONE]`
- `routers/practice.py` — `/generate` returns LLM-generated problem; `/grade` calls `sympy_service.grade_answer()` then streams LLM feedback

### Frontend (`frontend/src/`)
- `types/index.ts` — single source of truth for all shared types (`SolveMetadata`, `VizHint`, `SympyResult`, etc.)
- `mock/responses.ts` — prototype data; `simulateStream()` replays text character-by-character
- `components/shared/StreamingText.tsx` — splits accumulated string on `$...$` / `$$...$$` boundaries; renders math via KaTeX, prose with `**bold**` support
- `components/solve/InlineVisualization.tsx` — receives `VizHint`, switches on `type` to render one of five Mafs components
- `components/explore/` — five self-contained interactive Mafs visualizers; all use `mathjs` for client-side expression evaluation
- Vite proxies `/api/*` → `localhost:8000` in dev, so `VITE_API_BASE_URL` is only needed in production

### VizHint type → component mapping
| `VizHint.type` | Component | Triggered by |
|---|---|---|
| `derivative_explorer` | `DerivativeExplorer` | derivative problems |
| `integral_visualizer` | `IntegralVisualizer` | integral problems |
| `unit_circle` | `UnitCircle` | trig expressions |
| `trig_wave` | `TrigWaveBuilder` | (manual in Explore) |
| `function_graph` | `FunctionGrapher` | equation / simplify |

## Environment variables (`.env` at repo root)
```
MODEL_ID=Qwen/Qwen2.5-Math-1.5B-Instruct   # swap any HF model here
HF_HOME=~/.cache/huggingface                 # weights cached here (~3GB first run)
ALLOWED_ORIGINS=http://localhost:5173
VITE_API_BASE_URL=http://localhost:8000      # only needed when not using Vite proxy
VITE_USE_MOCK=true                           # set false to use real backend
```
