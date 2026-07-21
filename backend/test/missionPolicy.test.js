'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { authorizeTransition, evidenceDigest, telemetryDecision, validateMissionPlan } = require('../domain/missionPolicy');
const { adapterReadiness, requireAdapter } = require('../services/providerBoundary');

function validPlan() {
  return {
    tenantId: 'tenant-a',
    warehouseId: 'warehouse-1',
    operatorId: 'operator-1',
    aircraft: {
      id: 'drone-7',
      remoteIdReady: true,
      maintenanceBlocked: false,
      maxPayloadKg: 3,
      maxFlightMinutes: 30,
      maxWindKph: 25,
    },
    payloadKg: 1,
    estimatedMinutes: 18,
    reservePct: 31,
    weather: { windKph: 12, authoritative: true },
    waypoints: [
      { lat: 40.1, lon: -73.1, insideApprovedGeofence: true, airspaceClear: true },
      { lat: 40.2, lon: -73.2, insideApprovedGeofence: true, airspaceClear: true },
    ],
    contingency: { linkLoss: 'return_home' },
  };
}

test('accepts a mission only when safety evidence and limits are satisfied', () => {
  const result = validateMissionPlan(validPlan());
  assert.equal(result.ok, true);
  assert.match(result.digest, /^[a-f0-9]{64}$/);
});

test('rejects payload, geofence, airspace, weather, endurance, and reserve violations together', () => {
  const plan = validPlan();
  plan.payloadKg = 4;
  plan.estimatedMinutes = 40;
  plan.reservePct = 10;
  plan.weather = { windKph: 30, authoritative: false };
  plan.waypoints[0].insideApprovedGeofence = false;
  plan.waypoints[1].airspaceClear = false;
  const result = validateMissionPlan(plan);
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 7);
});

test('fails malformed telemetry safe to land', () => {
  assert.deepEqual(telemetryDecision({ batteryPct: 'unknown' }), { action: 'land', reasons: ['malformed telemetry'] });
});

test('returns home on link loss and lands for critical battery', () => {
  const returning = telemetryDecision({ batteryPct: 60, linkAgeSeconds: 20, localizationConfidence: 0.99, insideApprovedGeofence: true });
  assert.equal(returning.action, 'return_home');
  const landing = telemetryDecision({ batteryPct: 8, linkAgeSeconds: 0, localizationConfidence: 0.99, insideApprovedGeofence: true });
  assert.equal(landing.action, 'land');
});

test('requires dual approval and signed closure evidence', () => {
  const oneApproval = authorizeTransition({
    current: 'validated', next: 'approved', role: 'commander', approvals: [{ actorId: 1, decision: 'approve' }],
  });
  assert.equal(oneApproval.ok, false);
  const approved = authorizeTransition({
    current: 'validated', next: 'approved', role: 'commander',
    approvals: [{ actorId: 1, decision: 'approve' }, { actorId: 2, decision: 'approve' }],
  });
  assert.equal(approved.ok, true);
  const incompleteClose = authorizeTransition({ current: 'landed', next: 'closed', role: 'operator', evidence: { operatorSignature: 'sig' } });
  assert.equal(incompleteClose.ok, false);
});

test('evidence digests are stable across object key order', () => {
  assert.equal(evidenceDigest({ b: 2, a: 1 }), evidenceDigest({ a: 1, b: 2 }));
});

test('provider boundary is disabled and fail-closed without complete configuration', () => {
  const readiness = adapterReadiness({});
  assert.equal(readiness.ready, false);
  assert.equal(readiness.adapters.length, 6);
  assert.throws(() => requireAdapter('autopilot', {}), /not operationally ready/);
});

test('provider readiness requires enablement, endpoint, and credential for every adapter', () => {
  const env = {};
  for (const name of ['FLEET', 'AUTOPILOT', 'WEATHER', 'AIRSPACE', 'REMOTE_ID', 'WMS']) {
    env[`${name}_ADAPTER_ENABLED`] = 'true';
    env[`${name}_ADAPTER_URL`] = `https://${name.toLowerCase()}.example.invalid`;
    env[`${name}_ADAPTER_TOKEN`] = 'configured-at-runtime';
  }
  assert.equal(adapterReadiness(env).ready, true);
});
