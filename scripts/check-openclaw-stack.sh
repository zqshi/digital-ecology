#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

pm2 status

echo "\n[docker]"
docker compose -f infra/docker/docker-compose.yml ps || true

echo "\n[mission-broker]"
curl -sS http://127.0.0.1:${MISSION_PORT:-8081}/v1/health || true

echo "\n[runtime-gateway]"
curl -sS -X POST http://127.0.0.1:${RUNTIME_GATEWAY_PORT:-8082}/v1/transition/check \
  -H "content-type: application/json" \
  -H "x-actor-id: checker" \
  -d '{"actorId":"checker","missionId":"health-check","fromStatus":"SUBMITTED","toStatus":"CONTRACTED","highRisk":false,"dualApproval":false}' || true

echo "\n[db mode+signals]"
docker exec de-postgres psql -U de_user -d digital_ecology -c "SELECT mode, updated_at FROM autonomy_mode WHERE id=1;" || true
docker exec de-postgres psql -U de_user -d digital_ecology -c "SELECT passive_index, l3_incidents_last_24h, on_time_delivery_rate, first_pass_acceptance_rate, hard_stop, updated_at FROM runtime_signals WHERE id=1;" || true
