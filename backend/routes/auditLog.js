// Read-only audit log routes; writes happen via middleware (see middleware/auditLog.js).
const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const actor = (req.query.actor || '').toString();
    const resource = (req.query.resource || '').toString();
    const params = [];
    const where = [];
    if (actor) { params.push(actor); where.push(`actor_email = $${params.length}`); }
    if (resource) { params.push(resource); where.push(`resource_type = $${params.length}`); }
    params.push(limit);
    const sql = `SELECT * FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT $${params.length}`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM audit_log WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
