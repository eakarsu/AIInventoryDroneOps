const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'telemetry', fields: ['drone_serial','recorded_at','motor_temp','battery_pct'] });
