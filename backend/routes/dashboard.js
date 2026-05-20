const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [warehouses_q, drones_q, missions_q, scan_results_q, discrepancies_q, zones_q, sku_master_q, wms_snapshots_q, work_orders_q, maintenance_events_q, telemetry_q] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM warehouses"),
      pool.query("SELECT COUNT(*) AS total FROM drones"),
      pool.query("SELECT COUNT(*) AS total FROM missions"),
      pool.query("SELECT COUNT(*) AS total FROM scan_results"),
      pool.query("SELECT COUNT(*) AS total FROM discrepancies"),
      pool.query("SELECT COUNT(*) AS total FROM zones"),
      pool.query("SELECT COUNT(*) AS total FROM sku_master"),
      pool.query("SELECT COUNT(*) AS total FROM wms_snapshots"),
      pool.query("SELECT COUNT(*) AS total FROM work_orders"),
      pool.query("SELECT COUNT(*) AS total FROM maintenance_events"),
      pool.query("SELECT COUNT(*) AS total FROM telemetry")
    ]);
    res.json({
      warehouses: warehouses_q.rows[0],
      drones: drones_q.rows[0],
      missions: missions_q.rows[0],
      scan_results: scan_results_q.rows[0],
      discrepancies: discrepancies_q.rows[0],
      zones: zones_q.rows[0],
      sku_master: sku_master_q.rows[0],
      wms_snapshots: wms_snapshots_q.rows[0],
      work_orders: work_orders_q.rows[0],
      maintenance_events: maintenance_events_q.rows[0],
      telemetry: telemetry_q.rows[0]
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
