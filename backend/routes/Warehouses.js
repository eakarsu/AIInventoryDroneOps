const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'warehouses', fields: ['name','address','sqft','status'] });
