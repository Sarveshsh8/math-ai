#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Load .env if present (export each non-comment line)
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT/.env"
  set +a
fi

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[math-ai]${RESET} $*"; }
ok()   { echo -e "${GREEN}[math-ai]${RESET} $*"; }
warn() { echo -e "${YELLOW}[math-ai]${RESET} $*"; }
die()  { echo -e "${RED}[math-ai] ERROR:${RESET} $*"; exit 1; }

PIDS=()
cleanup() {
  echo ""
  log "Shutting down..."
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null
  ok "Done."
}
trap cleanup EXIT INT TERM

command -v python3 >/dev/null 2>&1 || die "python3 not found"
command -v node    >/dev/null 2>&1 || die "node not found"
command -v npm     >/dev/null 2>&1 || die "npm not found"
command -v mvn     >/dev/null 2>&1 || die "mvn not found (install Maven)"
command -v java    >/dev/null 2>&1 || die "java not found (install JDK 21+)"
command -v stripe  >/dev/null 2>&1 || warn "stripe CLI not found — webhook forwarding skipped (brew install stripe/stripe-cli/stripe)"

export AI_INTERNAL_TOKEN="${AI_INTERNAL_TOKEN:-$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
)}"
export JWT_SECRET="${JWT_SECRET:-$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
)}"

# ── AI service (Python FastAPI) ───────────────────────────────────────────────
AI="$ROOT/ai"
VENV="$AI/.venv"

log "Setting up AI service..."
if [ ! -d "$VENV" ]; then
  python3 -m venv "$VENV"
fi
source "$VENV/bin/activate"
pip install -q -r "$AI/requirements.txt"
ok "AI service dependencies ready."

# ── Frontend ──────────────────────────────────────────────────────────────────
log "Installing frontend dependencies..."
cd "$ROOT/frontend" && npm install --silent
cd "$ROOT"
ok "Frontend dependencies ready."

# ── Spring Boot backend ────────────────────────────────────────────────────────
log "Building Spring Boot backend..."
cd "$ROOT/backend" && mvn -q package -DskipTests
cd "$ROOT"
ok "Spring Boot backend built."

# ── Start AI service ──────────────────────────────────────────────────────────
log "Starting AI service on http://localhost:8000 ..."
log "  (first run downloads ~3GB model weights)"
cd "$AI"
uvicorn main:app --host "${AI_HOST:-127.0.0.1}" --port "${AI_PORT:-8000}" &
AI_PID=$!
PIDS+=($AI_PID)
cd "$ROOT"

log "Waiting for AI service..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8000/api/health >/dev/null 2>&1; then
    ok "AI service ready."; break
  fi
  [ "$i" -eq 60 ] && die "AI service did not start after 5 minutes."
  sleep 5
done

# ── Start Spring Boot ─────────────────────────────────────────────────────────
log "Starting Spring Boot backend on http://localhost:8080 ..."
cd "$ROOT/backend"
java -jar target/mathai-backend-0.0.1-SNAPSHOT.jar &
SPRING_PID=$!
PIDS+=($SPRING_PID)
cd "$ROOT"

log "Waiting for Spring Boot..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1; then
    ok "Spring Boot ready."; break
  fi
  [ "$i" -eq 30 ] && die "Spring Boot did not start after 30 seconds."
  sleep 1
done

# ── Stripe webhook forwarding ─────────────────────────────────────────────────
if command -v stripe >/dev/null 2>&1; then
  log "Starting Stripe webhook forwarding..."
  stripe listen --forward-to localhost:8080/api/billing/webhook &
  STRIPE_PID=$!
  PIDS+=($STRIPE_PID)
  ok "Stripe forwarding started."
fi

# ── Start frontend ────────────────────────────────────────────────────────────
log "Starting frontend on http://localhost:5173 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
cd "$ROOT"

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  math·ai is running${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  App:     ${CYAN}http://localhost:5173${RESET}"
echo -e "  Backend: ${CYAN}http://localhost:8080${RESET}  (Spring Boot)"
echo -e "  AI:      ${CYAN}http://localhost:8000${RESET}  (FastAPI, internal)"
command -v stripe >/dev/null 2>&1 && echo -e "  Stripe:  webhook forwarding → localhost:8080"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop"
echo ""

wait
