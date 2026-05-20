const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'scan_results', fields: ['mission_id_ref','sku','location','quantity','scanned_at'] });
