'use strict';

const express = require('express');
const pool = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { authorizeTransition, evidenceDigest, telemetryDecision, validateMissionPlan } = require('../domain/missionPolicy');
const { adapterReadiness } = require('../services/providerBoundary');

const router = express.Router();
const control = requireRole('operator', 'commander', 'safety_officer');
const approve = requireRole('commander', 'safety_officer');

function tenantId(req) {
  return String(req.user?.tenantId || req.user?.tenant_id || '');
}

function requiredHeader(req, name) {
  const value = String(req.get(name) || '').trim();
  if (!value || value.length > 160) throw Object.assign(new Error(`${name} header is required`), { status: 400 });
  return value;
}

async function inTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

router.post('/plan', control, async (req, res) => {
  try {
    const tenant = tenantId(req);
    if (!tenant) return res.status(403).json({ error: 'tenant membership is required' });
    const idempotencyKey = requiredHeader(req, 'Idempotency-Key');
    const plan = { ...req.body, tenantId: tenant, operatorId: req.user.id };
    const validation = validateMissionPlan(plan);
    if (!validation.ok) return res.status(422).json({ error: 'mission plan rejected', details: validation.errors });
    const result = await inTransaction(async (client) => {
      const existing = await client.query(
        'SELECT * FROM mission_operations WHERE tenant_id=$1 AND idempotency_key=$2',
        [tenant, idempotencyKey]
      );
      if (existing.rows[0]) return { mission: existing.rows[0], replayed: true };
      const inserted = await client.query(
        `INSERT INTO mission_operations
         (tenant_id, idempotency_key, warehouse_id, aircraft_id, operator_id, state, plan, plan_digest)
         VALUES ($1,$2,$3,$4,$5,'validated',$6,$7) RETURNING *`,
        [tenant, idempotencyKey, plan.warehouseId, plan.aircraft.id, req.user.id, plan, validation.digest]
      );
      await client.query(
        `INSERT INTO mission_operation_events
         (tenant_id, mission_id, actor_id, event_type, from_state, to_state, evidence_digest, payload)
         VALUES ($1,$2,$3,'plan_validated','draft','validated',$4,$5)`,
        [tenant, inserted.rows[0].id, req.user.id, validation.digest, { validation: 'deterministic-v1' }]
      );
      return { mission: inserted.rows[0], replayed: false };
    });
    res.status(result.replayed ? 200 : 201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.status ? error.message : 'mission plan could not be persisted' });
  }
});

router.get('/integrations/readiness', (_req, res) => {
  const readiness = adapterReadiness();
  res.status(readiness.ready ? 200 : 503).json(readiness);
});

router.post('/:id/approvals', approve, async (req, res) => {
  try {
    const tenant = tenantId(req);
    if (!tenant) return res.status(403).json({ error: 'tenant membership is required' });
    if (!['approve', 'reject'].includes(req.body?.decision)) return res.status(422).json({ error: 'decision must be approve or reject' });
    if (!String(req.body?.attestation || '').trim()) return res.status(422).json({ error: 'approval attestation is required' });
    const result = await inTransaction(async (client) => {
      const found = await client.query(
        'SELECT id, operator_id FROM mission_operations WHERE id=$1 AND tenant_id=$2 FOR UPDATE',
        [req.params.id, tenant]
      );
      if (!found.rows[0]) throw Object.assign(new Error('mission not found'), { status: 404 });
      if (Number(found.rows[0].operator_id) === Number(req.user.id)) {
        throw Object.assign(new Error('mission operator cannot approve the same mission'), { status: 409 });
      }
      const digest = evidenceDigest({ decision: req.body.decision, attestation: req.body.attestation });
      const inserted = await client.query(
        `INSERT INTO mission_approvals (tenant_id, mission_id, actor_id, decision, evidence_digest)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (tenant_id, mission_id, actor_id) DO UPDATE
         SET decision=EXCLUDED.decision, evidence_digest=EXCLUDED.evidence_digest, created_at=NOW()
         RETURNING id, mission_id, actor_id, decision, evidence_digest, created_at`,
        [tenant, req.params.id, req.user.id, req.body.decision, digest]
      );
      await client.query(
        `INSERT INTO mission_operation_events
         (tenant_id, mission_id, actor_id, event_type, payload, evidence_digest)
         VALUES ($1,$2,$3,'approval_recorded',$4,$5)`,
        [tenant, req.params.id, req.user.id, { decision: req.body.decision }, digest]
      );
      return inserted.rows[0];
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.status ? error.message : 'approval could not be recorded' });
  }
});

router.post('/:id/transition', control, async (req, res) => {
  try {
    const tenant = tenantId(req);
    if (!tenant) return res.status(403).json({ error: 'tenant membership is required' });
    const expectedRevision = Number(requiredHeader(req, 'If-Match'));
    if (!Number.isInteger(expectedRevision) || expectedRevision < 1) return res.status(400).json({ error: 'If-Match must be a positive revision' });
    const result = await inTransaction(async (client) => {
      const found = await client.query(
        'SELECT * FROM mission_operations WHERE id=$1 AND tenant_id=$2 FOR UPDATE',
        [req.params.id, tenant]
      );
      const mission = found.rows[0];
      if (!mission) throw Object.assign(new Error('mission not found'), { status: 404 });
      if (mission.revision !== expectedRevision) throw Object.assign(new Error('mission revision conflict'), { status: 409 });
      const approvals = (await client.query(
        'SELECT actor_id AS "actorId", decision FROM mission_approvals WHERE tenant_id=$1 AND mission_id=$2',
        [tenant, mission.id]
      )).rows;
      const authorization = authorizeTransition({
        current: mission.state,
        next: req.body?.nextState,
        role: req.user.role,
        approvals,
        evidence: req.body?.evidence,
      });
      if (!authorization.ok) throw Object.assign(new Error(authorization.errors.join('; ')), { status: 422 });
      const updated = await client.query(
        `UPDATE mission_operations SET state=$1, revision=revision+1, evidence_digest=COALESCE($2,evidence_digest),
         updated_at=NOW() WHERE id=$3 AND tenant_id=$4 AND revision=$5 RETURNING *`,
        [req.body.nextState, authorization.evidenceDigest, mission.id, tenant, expectedRevision]
      );
      await client.query(
        `INSERT INTO mission_operation_events
         (tenant_id, mission_id, actor_id, event_type, from_state, to_state, evidence_digest, payload)
         VALUES ($1,$2,$3,'state_transition',$4,$5,$6,$7)`,
        [tenant, mission.id, req.user.id, mission.state, req.body.nextState, authorization.evidenceDigest, req.body.evidence || {}]
      );
      return updated.rows[0];
    });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.status ? error.message : 'mission transition failed' });
  }
});

router.post('/:id/telemetry', control, async (req, res) => {
  try {
    const tenant = tenantId(req);
    if (!tenant) return res.status(403).json({ error: 'tenant membership is required' });
    const decision = telemetryDecision(req.body, req.body?.limits);
    const digest = evidenceDigest(req.body || {});
    await pool.query(
      `INSERT INTO mission_telemetry_evidence (tenant_id, mission_id, actor_id, sample_digest, sample, control_action)
       SELECT $1,id,$2,$3,$4,$5 FROM mission_operations WHERE id=$6 AND tenant_id=$1`,
      [tenant, req.user.id, digest, req.body, decision.action, req.params.id]
    );
    if (decision.action !== 'continue') {
      await pool.query(
        `INSERT INTO integration_outbox (tenant_id, aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1,'mission',$2,'flight_control_command',$3)`,
        [tenant, req.params.id, { decision, requiresOperatorAcknowledgement: true }]
      );
    }
    res.status(decision.action === 'continue' ? 200 : 202).json({ decision, digest, authoritativeCommand: false });
  } catch (_) {
    res.status(500).json({ error: 'telemetry evidence could not be recorded; operator control remains authoritative' });
  }
});

module.exports = router;
