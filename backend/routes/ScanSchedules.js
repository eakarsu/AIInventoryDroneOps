const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'scan_schedules',
  fields: ['name', 'warehouse_name', 'cron_expr', 'zone', 'sku_priority', 'drone_count', 'active', 'last_run_at', 'next_run_at', 'notes'],
});
