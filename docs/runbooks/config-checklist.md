# Config Checklist (User Provided)

## Required
1. Node.js 20 LTS installed.
2. npm available.
3. PM2 installed globally.
4. `.env` created from `.env.example`.

## Optional now, required later for LLM-enabled flows
- `LLM_API_KEY`
- `LLM_PROVIDER`
- `LLM_MODEL`

## Recommended initial values
- `AUTONOMY_MODE=SUPERVISED`
- `BOOTSTRAP_INTERVAL_MS=60000`
- `MODE_GUARDIAN_INTERVAL_MS=60000`
- `BOOTSTRAP_MAX_BUDGET=50`

## Validation Commands
- `node -v`
- `npm -v`
- `pm2 -v`
- `cat .env | rg 'AUTONOMY_MODE|BOOTSTRAP_INTERVAL_MS|LLM_'`
