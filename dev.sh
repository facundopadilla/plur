#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
  echo -e "\n${YELLOW}Deteniendo procesos...${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo -e "${GREEN}Listo.${NC}"
}
trap cleanup EXIT INT TERM

# ── Liberar puertos ─────────────────────────────────────────────────────────
echo -e "${YELLOW}[init]${NC} Liberando puertos 8000 y 5173..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

# ── Infra (Docker) ──────────────────────────────────────────────────────────
echo -e "${CYAN}[infra]${NC} Levantando PostgreSQL + Redis..."
docker compose -f "$ROOT/backend/docker/local.yml" up -d

# ── Esperar a que Postgres esté listo ───────────────────────────────────────
echo -e "${CYAN}[infra]${NC} Esperando a que PostgreSQL acepte conexiones..."
MAX_RETRIES=30
RETRIES=0
until docker compose -f "$ROOT/backend/docker/local.yml" exec -T db \
    pg_isready -U postgres -q 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo -e "${YELLOW}[infra]${NC} PostgreSQL no respondió después de ${MAX_RETRIES}s. Revisá los logs:"
    echo "  docker compose -f backend/docker/local.yml logs db"
    exit 1
  fi
  sleep 1
done
echo -e "${CYAN}[infra]${NC} PostgreSQL listo."

# ── Backend ─────────────────────────────────────────────────────────────────
echo -e "${CYAN}[backend]${NC} Aplicando migraciones..."
cd "$ROOT/backend"
uv run python manage.py migrate --run-syncdb 2>&1 | sed "s/^/$(printf "${CYAN}[backend]${NC}") /"

echo -e "${CYAN}[backend]${NC} Iniciando Django en :8000"
uv run python manage.py runserver 2>&1 | sed "s/^/$(printf "${CYAN}[backend]${NC}") /" &
BACKEND_PID=$!

# ── Frontend ─────────────────────────────────────────────────────────────────
echo -e "${GREEN}[frontend]${NC} Iniciando Vite en :5173"
cd "$ROOT/frontend"
pnpm dev 2>&1 | sed "s/^/$(printf "${GREEN}[frontend]${NC}") /" &
FRONTEND_PID=$!

echo -e "\n${YELLOW}Ctrl+C para detener todo.${NC}\n"

wait "$BACKEND_PID" "$FRONTEND_PID"
