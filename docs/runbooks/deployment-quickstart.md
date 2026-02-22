# Runbook: Deployment Quickstart

## 1) Prepare
1. Ensure Node.js 20 LTS and npm are installed.
2. Install PM2:
`npm i -g pm2`
3. In project root:
`npm install`

## 2) Configure
1. Copy env:
`cp .env.example .env`
2. Edit `.env` values, including optional LLM key:
- `LLM_API_KEY=<your_key>`

## 3) Start
`./scripts/start-openclaw-stack.sh`

## 4) Check
`./scripts/check-openclaw-stack.sh`

## 5) Stop
`./scripts/stop-openclaw-stack.sh`

## Notes
- LLM key is optional for current M1 runtime; required once evolution/archaeology LLM flows are enabled.
- Keep `AUTONOMY_MODE=SUPERVISED` unless AUTO entry criteria are met.
