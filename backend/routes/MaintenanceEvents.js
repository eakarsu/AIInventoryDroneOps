const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'maintenance_events', fields: ['drone_serial','event_type','performed_at','technician'] });
