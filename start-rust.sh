#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

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
  wait 2>/dev/null || true
  ok "Done."
}
trap cleanup EXIT INT TERM

if [ -f "$HOME/.cargo/env" ]; then
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
fi

command -v cargo >/dev/null 2>&1 || die "cargo not found (install Rust from https://rustup.rs)"
command -v node  >/dev/null 2>&1 || die "node not found"
command -v npm   >/dev/null 2>&1 || die "npm not found"

export JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 48)}"
export MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/mathai}"

log "Installing frontend dependencies..."
cd "$ROOT/frontend" && npm install --silent
cd "$ROOT"
ok "Frontend dependencies ready."

log "Starting Rust backend on http://localhost:8080 ..."
cd "$ROOT/rust-backend"
cargo run &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)
cd "$ROOT"

log "Waiting for Rust backend..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1; then
    ok "Rust backend ready."; break
  fi
  [ "$i" -eq 60 ] && die "Rust backend did not start after 60 seconds."
  sleep 1
done

log "Starting frontend on http://localhost:5173 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
cd "$ROOT"

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  math·ai is running on Rust phase 1${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  App:     ${CYAN}http://localhost:5173${RESET}"
echo -e "  Backend: ${CYAN}http://localhost:8080${RESET}  (Rust)"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop"
echo ""

wait
