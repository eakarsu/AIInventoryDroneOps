// Cross-DC reconciliation: aggregates scan_results across multiple warehouses
// and surfaces SKUs whose totals don't match expected (from sku_master).
const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const router = express.Router();

// POST /api/cross-dc-reconciliations/run
// body: { warehouses: ["Reno DC","Memphis Hub"], notes? }
router.post('/run', requireWriter, async (req, res) => {
  try {
    const warehouses = Array.isArray(req.body && req.body.warehouses) ? req.body.warehouses : [];
    if (warehouses.length < 2) return res.status(400).json({ error: 'at least 2 warehouses required' });

    // Pull mission ids per warehouse, then aggregate scan totals per SKU.
    const perWarehouse = {};
    for (const wh of warehouses) {
      const m = await pool.query('SELECT id FROM missions WHERE warehouse_name = $1', [wh]);
      const ids = m.rows.map((r) => String(r.id));
      if (!ids.length) { perWarehouse[wh] = {}; continue; }
      const sr = await pool.query(
        `SELECT sku, SUM(quantity)::int AS total FROM scan_results WHERE mission_id_ref = ANY($1) GROUP BY sku`,
        [ids]
      );
      perWarehouse[wh] = Object.fromEntries(sr.rows.map((r) => [r.sku, r.total]));
    }

    const expected = {};
    const em = await pool.query('SELECT sku, expected_qty FROM sku_master');
    for (const row of em.rows) expected[row.sku] = row.expected_qty;

    const skuSet = new Set();
    Object.values(perWarehouse).forEach((m) => Object.keys(m).forEach((s) => skuSet.add(s)));

    const imbalances = [];
    for (const sku of skuSet) {
      const totals = {};
      let grand = 0;
      for (const wh of warehouses) {
        const v = perWarehouse[wh][sku] || 0;
        totals[wh] = v;
        grand += v;
      }
      const exp = expected[sku] || 0;
      const delta = grand - exp;
      if (delta !== 0 || Math.max(...Object.values(totals)) - Math.min(...Object.values(totals)) > 0) {
        imbalances.push({ sku, totals, grand_total: grand, expected_total: exp, delta });
      }
    }
    imbalances.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const result = {
      warehouses,
      sku_count: skuSet.size,
      imbalance_count: imbalances.length,
      imbalances: imbalances.slice(0, 200),
    };

    const ins = await pool.query(
      `INSERT INTO cross_dc_reconciliations (warehouses, sku_count, imbalance_count, result, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [warehouses.join(','), skuSet.size, imbalances.length, JSON.stringify(result), (req.body && req.body.notes) || null]
    );

    res.status(201).json({ ...ins.rows[0], imbalances: result.imbalances });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, warehouses, sku_count, imbalance_count, notes, created_at FROM cross_dc_reconciliations ORDER BY created_at DESC LIMIT 100');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM cross_dc_reconciliations WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
