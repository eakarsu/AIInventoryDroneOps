'use strict';

const crypto = require('crypto');

const TRANSITIONS = Object.freeze({
  draft: new Set(['validated', 'cancelled']),
  validated: new Set(['approved', 'draft', 'cancelled']),
  approved: new Set(['dispatched', 'cancelled']),
  dispatched: new Set(['in_flight', 'cancelled']),
  in_flight: new Set(['returning', 'contingency', 'landed']),
  contingency: new Set(['returning', 'landed']),
  returning: new Set(['landed']),
  landed: new Set(['closed']),
  closed: new Set(),
  cancelled: new Set(),
});

const CONTROL_ROLES = new Set(['operator', 'commander', 'safety_officer']);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function evidenceDigest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

function finite(value, name, errors) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) errors.push(`${name} must be a finite number`);
  return parsed;
}

function validateMissionPlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return { ok: false, errors: ['plan is required'] };
  if (!String(plan.tenantId || '').trim()) errors.push('tenantId is required');
  if (!String(plan.warehouseId || '').trim()) errors.push('warehouseId is required');
  if (!String(plan.operatorId || '').trim()) errors.push('operatorId is required');
  const aircraft = plan.aircraft || {};
  if (!String(aircraft.id || '').trim()) errors.push('aircraft.id is required');
  if (aircraft.remoteIdReady !== true) errors.push('aircraft remote ID must be ready');
  if (aircraft.maintenanceBlocked === true) errors.push('aircraft is maintenance-blocked');
  const payloadKg = finite(plan.payloadKg, 'payloadKg', errors);
  const maxPayloadKg = finite(aircraft.maxPayloadKg, 'aircraft.maxPayloadKg', errors);
  if (payloadKg < 0) errors.push('payloadKg cannot be negative');
  if (payloadKg > maxPayloadKg) errors.push('payload exceeds aircraft limit');
  const estimatedMinutes = finite(plan.estimatedMinutes, 'estimatedMinutes', errors);
  const maxFlightMinutes = finite(aircraft.maxFlightMinutes, 'aircraft.maxFlightMinutes', errors);
  if (estimatedMinutes <= 0) errors.push('estimatedMinutes must be positive');
  if (estimatedMinutes > maxFlightMinutes) errors.push('route exceeds aircraft endurance');
  const reservePct = finite(plan.reservePct, 'reservePct', errors);
  if (reservePct < 25) errors.push('energy reserve must be at least 25%');
  const weather = plan.weather || {};
  const windKph = finite(weather.windKph, 'weather.windKph', errors);
  const maxWindKph = finite(aircraft.maxWindKph, 'aircraft.maxWindKph', errors);
  if (windKph > maxWindKph) errors.push('wind exceeds aircraft limit');
  if (weather.authoritative !== true) errors.push('authoritative weather evidence is required');
  if (!Array.isArray(plan.waypoints) || plan.waypoints.length < 2) {
    errors.push('at least two validated waypoints are required');
  } else {
    plan.waypoints.forEach((point, index) => {
      const lat = Number(point?.lat);
      const lon = Number(point?.lon);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
        errors.push(`waypoint ${index} has invalid coordinates`);
      }
      if (point?.insideApprovedGeofence !== true) errors.push(`waypoint ${index} is outside the approved geofence`);
      if (point?.airspaceClear !== true) errors.push(`waypoint ${index} lacks airspace clearance`);
    });
  }
  if (!plan.contingency || !['return_home', 'land_in_place'].includes(plan.contingency.linkLoss)) {
    errors.push('an explicit link-loss contingency is required');
  }
  return { ok: errors.length === 0, errors, digest: evidenceDigest(plan) };
}

function telemetryDecision(sample, limits = {}) {
  const reasons = [];
  const batteryPct = Number(sample?.batteryPct);
  const linkAgeSeconds = Number(sample?.linkAgeSeconds);
  const localizationConfidence = Number(sample?.localizationConfidence);
  if (!Number.isFinite(batteryPct) || !Number.isFinite(linkAgeSeconds) || !Number.isFinite(localizationConfidence)) {
    return { action: 'land', reasons: ['malformed telemetry'] };
  }
  if (sample.emergencyStop === true || sample.collisionRisk === true) reasons.push('immediate hazard');
  if (sample.insideApprovedGeofence !== true) reasons.push('geofence breach');
  if (localizationConfidence < Number(limits.minLocalizationConfidence ?? 0.8)) reasons.push('localization confidence low');
  if (batteryPct <= Number(limits.landBatteryPct ?? 10)) return { action: 'land', reasons: [...reasons, 'critical battery'] };
  if (reasons.includes('immediate hazard')) return { action: 'land', reasons };
  if (linkAgeSeconds > Number(limits.maxLinkAgeSeconds ?? 10)) reasons.push('communications lost');
  if (batteryPct <= Number(limits.returnBatteryPct ?? 25)) reasons.push('return reserve reached');
  return reasons.length ? { action: 'return_home', reasons } : { action: 'continue', reasons: [] };
}

function authorizeTransition({ current, next, role, approvals = [], evidence }) {
  const errors = [];
  if (!TRANSITIONS[current]?.has(next)) errors.push(`transition ${current} -> ${next} is not allowed`);
  if (!CONTROL_ROLES.has(role)) errors.push('operator control role is required');
  if (next === 'approved') {
    const distinct = new Set(approvals.filter((item) => item?.decision === 'approve').map((item) => item.actorId));
    if (distinct.size < 2) errors.push('two distinct approvals are required');
  }
  if (next === 'closed' && (!evidence?.operatorSignature || !evidence?.telemetryDigest || !evidence?.inventoryReceipt)) {
    errors.push('signed operator, telemetry, and inventory evidence is required to close');
  }
  return { ok: errors.length === 0, errors, evidenceDigest: evidence ? evidenceDigest(evidence) : null };
}

module.exports = { TRANSITIONS, authorizeTransition, evidenceDigest, telemetryDecision, validateMissionPlan };
