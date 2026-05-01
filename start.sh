#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[math-ai]${RESET} $*"; }
ok()   { echo -e "${GREEN}[math-ai]${RESET} $*"; }
warn() { echo -e "${YELLOW}[math-ai]${RESET} $*"; }
die()  { echo -e "${RED}[math-ai] ERROR:${RESET} $*"; exit 1; }

# ── Cleanup on exit ───────────────────────────────────────────────────────────
PIDS=()
cleanup() {
  echo ""
  log "Shutting down..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
  ok "Done."
}
trap cleanup EXIT INT TERM

# ── Check requirements ────────────────────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || die "python3 not found"
command -v node    >/dev/null 2>&1 || die "node not found"
command -v npm     >/dev/null 2>&1 || die "npm not found"

# ── Backend setup ─────────────────────────────────────────────────────────────
BACKEND="$ROOT/backend"
VENV="$BACKEND/.venv"

log "Setting up backend..."

if [ ! -d "$VENV" ]; then
  log "Creating Python virtual environment..."
  python3 -m venv "$VENV"
fi

source "$VENV/bin/activate"

log "Installing Python dependencies..."
pip install -q -r "$BACKEND/requirements.txt"

ok "Backend dependencies ready."

# ── Frontend setup ────────────────────────────────────────────────────────────
FRONTEND="$ROOT/frontend"

log "Installing frontend dependencies..."
cd "$FRONTEND" && npm install --silent
cd "$ROOT"

ok "Frontend dependencies ready."

# ── Start backend ─────────────────────────────────────────────────────────────
log "Starting backend on http://localhost:8000 ..."
log "  (first run downloads ~3GB model weights — this may take a few minutes)"

cd "$BACKEND"
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)
cd "$ROOT"

# Wait for backend to be ready (up to 5 min for model download)
log "Waiting for backend..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8000/api/health >/dev/null 2>&1; then
    ok "Backend ready."
    break
  fi
  if [ "$i" -eq 60 ]; then
    die "Backend did not start after 5 minutes."
  fi
  sleep 5
done

# ── Start frontend ────────────────────────────────────────────────────────────
log "Starting frontend on http://localhost:5173 ..."
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
cd "$ROOT"

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  MathAI is running${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  App:     ${CYAN}http://localhost:5173${RESET}"
echo -e "  API:     ${CYAN}http://localhost:8000${RESET}"
echo -e "  API docs:${CYAN}http://localhost:8000/docs${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop"
echo ""

wait
