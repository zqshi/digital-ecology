#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "[start] .env not found. Created from .env.example"
fi

set -a
if [ -f .env ]; then
  # Load only KEY=VALUE lines to avoid accidental command execution from free-form text.
  source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=.*$' .env)
fi
set +a

docker compose -f infra/docker/docker-compose.yml up -d

for i in {1..30}; do
  if docker exec de-postgres pg_isready -U de_user -d digital_ecology >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

npm run db:migrate

pm2 start ecosystem.config.js --env production
pm2 save
pm2 status
