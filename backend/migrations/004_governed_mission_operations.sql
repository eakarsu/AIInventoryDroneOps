-- Governed mission operations boundary. Apply explicitly with scripts/migrate.sh.
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_digest TEXT;

CREATE TABLE IF NOT EXISTS tenant_memberships (
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('viewer','analyst','operator','safety_officer','commander')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS mission_operations (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  idempotency_key TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  aircraft_id TEXT NOT NULL,
  operator_id INTEGER NOT NULL REFERENCES users(id),
  state TEXT NOT NULL CHECK (state IN ('draft','validated','approved','dispatched','in_flight','contingency','returning','landed','closed','cancelled')),
  revision INTEGER NOT NULL DEFAULT 1,
  plan JSONB NOT NULL,
  plan_digest CHAR(64) NOT NULL,
  evidence_digest CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS mission_operations_tenant_state_idx ON mission_operations(tenant_id, state, updated_at DESC);

CREATE TABLE IF NOT EXISTS mission_approvals (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  mission_id BIGINT NOT NULL REFERENCES mission_operations(id),
  actor_id INTEGER NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK (decision IN ('approve','reject')),
  evidence_digest CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, mission_id, actor_id)
);

CREATE TABLE IF NOT EXISTS mission_operation_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  mission_id BIGINT NOT NULL REFERENCES mission_operations(id),
  actor_id INTEGER REFERENCES users(id),
  event_type TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  evidence_digest CHAR(64),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mission_operation_events_timeline_idx ON mission_operation_events(tenant_id, mission_id, id);

CREATE OR REPLACE FUNCTION prevent_mission_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'mission operation evidence is append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS mission_operation_events_append_only ON mission_operation_events;
CREATE TRIGGER mission_operation_events_append_only
BEFORE UPDATE OR DELETE ON mission_operation_events
FOR EACH ROW EXECUTE FUNCTION prevent_mission_event_mutation();

CREATE TABLE IF NOT EXISTS mission_telemetry_evidence (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  mission_id BIGINT NOT NULL REFERENCES mission_operations(id),
  actor_id INTEGER REFERENCES users(id),
  sample_digest CHAR(64) NOT NULL,
  sample JSONB NOT NULL,
  control_action TEXT NOT NULL CHECK (control_action IN ('continue','return_home','land')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_outbox (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','delivered','dead_letter')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS integration_outbox_delivery_idx ON integration_outbox(status, next_attempt_at);

CREATE TABLE IF NOT EXISTS integration_failures (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  integration TEXT NOT NULL,
  operation TEXT NOT NULL,
  aggregate_id TEXT,
  retryable BOOLEAN NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  error_code TEXT NOT NULL,
  sanitized_detail TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mission_safety_exercises (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  mission_id BIGINT REFERENCES mission_operations(id),
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('simulation','controlled_field_test')),
  scenario TEXT NOT NULL,
  acceptance_criteria JSONB NOT NULL,
  result JSONB,
  approved_by INTEGER REFERENCES users(id),
  executed_at TIMESTAMPTZ
);
