const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'discrepancies', fields: ['mission_id_ref','sku','location','delta','severity','status'] });
