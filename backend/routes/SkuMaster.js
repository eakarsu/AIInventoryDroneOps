const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'sku_master', fields: ['sku','description','expected_qty','unit_cost'] });
