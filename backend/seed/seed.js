const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function main() {
  const migDir = path.join(__dirname, '..', 'migrations');
  for (const f of fs.readdirSync(migDir).filter((x) => x.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
    try { await pool.query(sql); console.log(`[seed] applied ${f}`); }
    catch (e) { console.warn(`[seed] ${f} warn: ${e.message}`); }
  }
  await pool.query(
    "INSERT INTO users (email, password, name, role) VALUES ('admin@inventory-drone-ops.local','secure123','Admin','commander') ON CONFLICT (email) DO NOTHING"
  );
  console.log('[seed] demo user ready');

  // warehouses
  for (const row of [{"name":"Reno DC","address":"4801 Capurro Way, Reno NV","sqft":420000,"status":"active"},{"name":"Memphis Hub","address":"2911 Sprankle Ave, Memphis TN","sqft":680000,"status":"active"},{"name":"Newark FC","address":"201 Doremus Ave, Newark NJ","sqft":280000,"status":"active"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO warehouses (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // drones
  for (const row of [{"serial":"DR-001","model":"Skydio X10","status":"ready","flight_hours":412,"battery_cycles":287},{"serial":"DR-002","model":"Skydio X10","status":"charging","flight_hours":518,"battery_cycles":362},{"serial":"DR-003","model":"Verity Aerodome","status":"maintenance","flight_hours":891,"battery_cycles":642},{"serial":"DR-004","model":"Skydio X10","status":"ready","flight_hours":212,"battery_cycles":147}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO drones (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // missions
  for (const row of [{"warehouse_name":"Reno DC","status":"complete","scheduled_at":null,"drone_count":3,"notes":"Nightly cycle count zone B"},{"warehouse_name":"Memphis Hub","status":"running","scheduled_at":null,"drone_count":5,"notes":null},{"warehouse_name":"Newark FC","status":"scheduled","scheduled_at":null,"drone_count":2,"notes":"Exception-driven only"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO missions (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // scan_results
  for (const row of [{"mission_id_ref":"m-001","sku":"SKU-A-001","location":"A-1-3","quantity":142,"scanned_at":null},{"mission_id_ref":"m-001","sku":"SKU-A-002","location":"A-1-4","quantity":0,"scanned_at":null},{"mission_id_ref":"m-001","sku":"SKU-B-118","location":"B-7-12","quantity":88,"scanned_at":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO scan_results (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // discrepancies
  for (const row of [{"mission_id_ref":"m-001","sku":"SKU-A-002","location":"A-1-4","delta":-50,"severity":"high","status":"recount"},{"mission_id_ref":"m-001","sku":"SKU-B-118","location":"B-7-12","delta":-2,"severity":"low","status":"open"},{"mission_id_ref":"m-002","sku":"SKU-C-451","location":"C-3-1","delta":140,"severity":"critical","status":"open"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO discrepancies (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // zones
  for (const row of [{"warehouse_name":"Reno DC","name":"A","aisle_count":12,"status":null},{"warehouse_name":"Reno DC","name":"B","aisle_count":12,"status":null},{"warehouse_name":"Memphis Hub","name":"F","aisle_count":18,"status":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO zones (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // sku_master
  for (const row of [{"sku":"SKU-A-001","description":"Toner cartridge","expected_qty":142,"unit_cost":48},{"sku":"SKU-A-002","description":"Paper ream","expected_qty":50,"unit_cost":6},{"sku":"SKU-B-118","description":"Office chair","expected_qty":88,"unit_cost":240}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO sku_master (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // wms_snapshots
  for (const row of [{"warehouse_name":"Reno DC","snapshot_at":null,"total_skus":8412,"notes":"Nightly"},{"warehouse_name":"Memphis Hub","snapshot_at":null,"total_skus":14820,"notes":"Nightly"},{"warehouse_name":"Newark FC","snapshot_at":null,"total_skus":6210,"notes":"Audit"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO wms_snapshots (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // work_orders
  for (const row of [{"drone_serial":"DR-003","type":"prop_replace","status":"scheduled","scheduled_for":null},{"drone_serial":"DR-002","type":"battery_swap","status":"in_progress","scheduled_for":null},{"drone_serial":"DR-001","type":"firmware","status":"complete","scheduled_for":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO work_orders (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // maintenance_events
  for (const row of [{"drone_serial":"DR-003","event_type":"prop replacement","performed_at":null,"technician":"M. Ortiz"},{"drone_serial":"DR-002","event_type":"battery swap","performed_at":null,"technician":"J. Kim"},{"drone_serial":"DR-001","event_type":"firmware update","performed_at":null,"technician":"A. Patel"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO maintenance_events (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // telemetry
  for (const row of [{"drone_serial":"DR-001","recorded_at":null,"motor_temp":64,"battery_pct":82},{"drone_serial":"DR-002","recorded_at":null,"motor_temp":71,"battery_pct":14},{"drone_serial":"DR-003","recorded_at":null,"motor_temp":78,"battery_pct":0}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO telemetry (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  console.log('[seed] domain rows seeded');
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
