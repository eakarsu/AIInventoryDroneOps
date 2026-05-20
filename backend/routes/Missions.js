const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'missions', fields: ['warehouse_name','status','scheduled_at','drone_count','notes'] });
