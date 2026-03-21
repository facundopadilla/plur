#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building production bundle..."
pnpm build

echo "==> Build complete. Output in dist/"
