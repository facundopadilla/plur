#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing uv..."
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

echo "==> Installing Python dependencies..."
uv sync --frozen

echo "==> Collecting static files..."
uv run python manage.py collectstatic --noinput

echo "==> Applying database migrations..."
uv run python manage.py migrate --noinput

echo "==> Build complete."
