const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'zones', fields: ['warehouse_name','name','aisle_count','status'] });
