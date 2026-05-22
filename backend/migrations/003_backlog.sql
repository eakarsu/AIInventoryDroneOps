-- Apply pass 7 (full backlog implementation)
-- New tables + schema deltas to support the prioritized backlog items.

-- ---- scan_schedules: recurring cycle-count plans ----
CREATE TABLE IF NOT EXISTS scan_schedules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  warehouse_name VARCHAR(255),
  cron_expr VARCHAR(120),
  zone VARCHAR(255),
  sku_priority VARCHAR(80),
  drone_count INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scan_schedules_warehouse ON scan_schedules (warehouse_name);

-- ---- audit_log: write-through mutation events ----
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor_email VARCHAR(150),
  actor_role VARCHAR(40),
  method VARCHAR(10),
  path VARCHAR(500),
  status_code INTEGER,
  resource_type VARCHAR(80),
  resource_id VARCHAR(120),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_email, created_at DESC);

-- ---- no_fly flag + geometry on zones ----
ALTER TABLE zones ADD COLUMN IF NOT EXISTS no_fly BOOLEAN DEFAULT FALSE;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS exclusion_geometry JSONB;

-- ---- blockchain proof-of-count: Merkle root per scan session ----
CREATE TABLE IF NOT EXISTS scan_proofs (
  id SERIAL PRIMARY KEY,
  mission_id_ref VARCHAR(255),
  scan_count INTEGER DEFAULT 0,
  merkle_root VARCHAR(128),
  algorithm VARCHAR(40) DEFAULT 'sha256-merkle-v1',
  leaves JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scan_proofs_mission ON scan_proofs (mission_id_ref);

-- ---- cross-DC reconciliation: persisted multi-warehouse runs ----
CREATE TABLE IF NOT EXISTS cross_dc_reconciliations (
  id SERIAL PRIMARY KEY,
  warehouses TEXT,
  sku_count INTEGER DEFAULT 0,
  imbalance_count INTEGER DEFAULT 0,
  result JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- technician dispatches (auto-dispatch off discrepancy/anomaly) ----
CREATE TABLE IF NOT EXISTS technician_dispatches (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(40),
  source_id INTEGER,
  technician VARCHAR(255),
  work_order_id INTEGER,
  severity VARCHAR(40),
  status VARCHAR(40) DEFAULT 'dispatched',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tech_dispatch_source ON technician_dispatches (source_type, source_id);
