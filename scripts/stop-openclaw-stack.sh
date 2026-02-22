#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
pm2 stop mission-broker runtime-gateway bootstrap-loop mode-guardian signal-collector || true
pm2 delete mission-broker runtime-gateway bootstrap-loop mode-guardian signal-collector || true
docker compose -f infra/docker/docker-compose.yml down || true
pm2 status
