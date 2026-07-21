'use strict';

const REQUIRED_ADAPTERS = Object.freeze([
  'FLEET',
  'AUTOPILOT',
  'WEATHER',
  'AIRSPACE',
  'REMOTE_ID',
  'WMS',
]);

function adapterReadiness(env = process.env) {
  const adapters = REQUIRED_ADAPTERS.map((name) => {
    const enabled = env[`${name}_ADAPTER_ENABLED`] === 'true';
    const endpointConfigured = Boolean(env[`${name}_ADAPTER_URL`]);
    const credentialConfigured = Boolean(env[`${name}_ADAPTER_TOKEN`]);
    const ready = enabled && endpointConfigured && credentialConfigured;
    return {
      name: name.toLowerCase(),
      enabled,
      ready,
      reason: ready ? null : 'disabled or missing endpoint/credential',
    };
  });
  return { ready: adapters.every((adapter) => adapter.ready), adapters };
}

function requireAdapter(name, env = process.env) {
  const readiness = adapterReadiness(env);
  const adapter = readiness.adapters.find((candidate) => candidate.name === String(name).toLowerCase());
  if (!adapter || !adapter.ready) {
    const error = new Error(`${name} adapter is not operationally ready`);
    error.code = 'ADAPTER_NOT_READY';
    error.retryable = false;
    throw error;
  }
  return adapter;
}

module.exports = { REQUIRED_ADAPTERS, adapterReadiness, requireAdapter };
