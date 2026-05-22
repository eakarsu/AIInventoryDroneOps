// Technician auto-dispatch: convert a discrepancy/anomaly into a work_order
// and record the dispatch in technician_dispatches.
const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const router = express.Router();

const TECH_POOL = ['Alex Park', 'Sam Rivera', 'Jordan Lee', 'Priya Shah', 'Devin Holt'];

function pickTechnician(severity) {
  // Deterministic-ish: hash severity char + epoch second.
  const sev = (severity || 'medium').toString().toLowerCase();
  const weight = { low: 0, medium: 1, high: 2, critical: 3 }[sev] ?? 1;
  const idx = (Math.floor(Date.now() / 1000) + weight) % TECH_POOL.length;
  return TECH_POOL[idx];
}

function slaMinutes(severity) {
  return { low: 480, medium: 240, high: 60, critical: 15 }[String(severity || 'medium').toLowerCase()] || 240;
}

// POST /api/technician-dispatches/from-discrepancy/:discrepancyId
router.post('/from-discrepancy/:discrepancyId', requireWriter, async (req, res) => {
  try {
    const d = await pool.query('SELECT * FROM discrepancies WHERE id = $1', [req.params.discrepancyId]);
    if (!d.rows.length) return res.status(404).json({ error: 'discrepancy not found' });
    const disc = d.rows[0];
    const tech = (req.body && req.body.technician) || pickTechnician(disc.severity);
    const sla = slaMinutes(disc.severity);
    const wo = await pool.query(
      `INSERT INTO work_orders (drone_serial, type, status, scheduled_for)
       VALUES ($1,$2,$3, NOW() + ($4 || ' minutes')::interval) RETURNING *`,
      [null, `discrepancy-${disc.id}`, 'dispatched', String(sla)]
    );
    const td = await pool.query(
      `INSERT INTO technician_dispatches (source_type, source_id, technician, work_order_id, severity, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      ['discrepancy', disc.id, tech, wo.rows[0].id, disc.severity, 'dispatched',
        `SKU ${disc.sku} loc ${disc.location} delta ${disc.delta}`]
    );
    res.status(201).json({ dispatch: td.rows[0], work_order: wo.rows[0], sla_minutes: sla });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/technician-dispatches/from-anomaly
// body: { source_id, severity, summary, drone_serial? }
router.post('/from-anomaly', requireWriter, async (req, res) => {
  try {
    const body = req.body || {};
    const severity = body.severity || 'medium';
    const tech = body.technician || pickTechnician(severity);
    const sla = slaMinutes(severity);
    const wo = await pool.query(
      `INSERT INTO work_orders (drone_serial, type, status, scheduled_for)
       VALUES ($1,$2,$3, NOW() + ($4 || ' minutes')::interval) RETURNING *`,
      [body.drone_serial || null, `anomaly-${body.source_id || 'manual'}`, 'dispatched', String(sla)]
    );
    const td = await pool.query(
      `INSERT INTO technician_dispatches (source_type, source_id, technician, work_order_id, severity, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      ['anomaly', body.source_id || null, tech, wo.rows[0].id, severity, 'dispatched', body.summary || null]
    );
    res.status(201).json({ dispatch: td.rows[0], work_order: wo.rows[0], sla_minutes: sla });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM technician_dispatches ORDER BY created_at DESC LIMIT 200');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM technician_dispatches WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
