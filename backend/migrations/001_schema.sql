-- Inventory Drone Operations schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(120) NOT NULL,
  name VARCHAR(120),
  role VARCHAR(30) DEFAULT 'commander',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_results (
  id SERIAL PRIMARY KEY,
  feature VARCHAR(80) NOT NULL,
  input JSONB,
  output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created ON ai_results (feature, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  title VARCHAR(200),
  body TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  source VARCHAR(80),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(60),
  resource_id INTEGER,
  filename VARCHAR(255),
  original_name VARCHAR(255),
  mimetype VARCHAR(120),
  size_bytes INTEGER,
  uploaded_by VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120),
  url VARCHAR(500),
  secret VARCHAR(120),
  events TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER,
  event VARCHAR(120),
  payload JSONB,
  status_code INTEGER,
  response_body TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  address VARCHAR(255),
  sqft INTEGER DEFAULT 0,
  status VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drones (
  id SERIAL PRIMARY KEY,
  serial VARCHAR(255),
  model VARCHAR(255),
  status VARCHAR(255),
  flight_hours INTEGER DEFAULT 0,
  battery_cycles INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  warehouse_name VARCHAR(255),
  status VARCHAR(255),
  scheduled_at TIMESTAMPTZ,
  drone_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_results (
  id SERIAL PRIMARY KEY,
  mission_id_ref VARCHAR(255),
  sku VARCHAR(255),
  location VARCHAR(255),
  quantity INTEGER DEFAULT 0,
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discrepancies (
  id SERIAL PRIMARY KEY,
  mission_id_ref VARCHAR(255),
  sku VARCHAR(255),
  location VARCHAR(255),
  delta INTEGER DEFAULT 0,
  severity VARCHAR(255),
  status VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  warehouse_name VARCHAR(255),
  name VARCHAR(255),
  aisle_count INTEGER DEFAULT 0,
  status VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sku_master (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(255),
  description VARCHAR(255),
  expected_qty INTEGER DEFAULT 0,
  unit_cost INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wms_snapshots (
  id SERIAL PRIMARY KEY,
  warehouse_name VARCHAR(255),
  snapshot_at TIMESTAMPTZ,
  total_skus INTEGER DEFAULT 0,
  notes VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  drone_serial VARCHAR(255),
  type VARCHAR(255),
  status VARCHAR(255),
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_events (
  id SERIAL PRIMARY KEY,
  drone_serial VARCHAR(255),
  event_type VARCHAR(255),
  performed_at TIMESTAMPTZ,
  technician VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry (
  id SERIAL PRIMARY KEY,
  drone_serial VARCHAR(255),
  recorded_at TIMESTAMPTZ,
  motor_temp INTEGER DEFAULT 0,
  battery_pct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
