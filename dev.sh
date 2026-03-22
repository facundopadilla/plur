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

# ── Avalanche (Fuji testnet) ───────────────────────────────────────────────
export AVALANCHE_BACKEND_PRIVATE_KEY="${AVALANCHE_BACKEND_PRIVATE_KEY:-0xff48970edd19f9168d6c5d700715d1b255a464ac10386e91b97ffb01b879aeb8}"
echo -e "${CYAN}[chain]${NC} Avalanche Fuji testnet habilitado (wallet: 0xe2D919b66F1Df21644Bf8dF638Bf9C04e383c2E4)"

# ── AI & Storage ──────────────────────────────────────────────────────────
export GEMINI_API_KEY="${GEMINI_API_KEY:-AIzaSyBEWA8YNugrPge_UhpHcU98iE-pl7xD8oo}"
export CLOUDINARY_URL="${CLOUDINARY_URL:-cloudinary://828685358723523:GI9fNsk3oSU5u-9Q96aBnM3VouI@dsnwiywmj}"
[ -n "$GEMINI_API_KEY" ] && echo -e "${CYAN}[ai]${NC} Gemini API habilitada" || echo -e "${YELLOW}[ai]${NC} GEMINI_API_KEY no configurada (fallback a placeholder)"
[ -n "$CLOUDINARY_URL" ] && echo -e "${CYAN}[storage]${NC} Cloudinary habilitado" || echo -e "${YELLOW}[storage]${NC} CLOUDINARY_URL no configurada"

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
