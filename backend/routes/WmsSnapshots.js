const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'wms_snapshots', fields: ['warehouse_name','snapshot_at','total_skus','notes'] });
