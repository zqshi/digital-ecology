CREATE TABLE IF NOT EXISTS missions (
  mission_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  budget_cap NUMERIC NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  acceptance_criteria JSONB NOT NULL,
  constraints JSONB NOT NULL,
  delivery_format TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  result TEXT NOT NULL,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS runtime_signals (
  id INT PRIMARY KEY DEFAULT 1,
  passive_index NUMERIC NOT NULL DEFAULT 0,
  l3_incidents_last_24h INT NOT NULL DEFAULT 0,
  on_time_delivery_rate NUMERIC NOT NULL DEFAULT 1,
  first_pass_acceptance_rate NUMERIC NOT NULL DEFAULT 1,
  hard_stop BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO runtime_signals (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS autonomy_mode (
  id INT PRIMARY KEY DEFAULT 1,
  mode TEXT NOT NULL CHECK (mode IN ('AUTO', 'SUPERVISED', 'LOCKDOWN')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO autonomy_mode (id, mode) VALUES (1, 'SUPERVISED')
ON CONFLICT (id) DO NOTHING;
