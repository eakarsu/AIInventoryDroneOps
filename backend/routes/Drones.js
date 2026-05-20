const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'drones', fields: ['serial','model','status','flight_hours','battery_cycles', 'x_position', 'y_position'] });
