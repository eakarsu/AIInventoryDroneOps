const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'work_orders', fields: ['drone_serial','type','status','scheduled_for'] });
