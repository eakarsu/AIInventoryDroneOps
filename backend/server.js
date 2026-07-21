const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');
const { auditLog } = require('./middleware/auditLog');

const app = express();
const PORT = process.env.BACKEND_PORT || 4061;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4060').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('cors'))), credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'AIInventoryDroneOps', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', authenticateToken);
app.use('/api', auditLog);

// CRUD entities
app.use('/api/warehouses', require('./routes/Warehouses'));
app.use('/api/drones', require('./routes/Drones'));
app.use('/api/missions', require('./routes/Missions'));
app.use('/api/mission-operations', require('./routes/missionOperations'));
app.use('/api/scan-results', require('./routes/ScanResults'));
app.use('/api/discrepancies', require('./routes/Discrepancies'));
app.use('/api/zones', require('./routes/Zones'));
app.use('/api/sku-master', require('./routes/SkuMaster'));
app.use('/api/wms-snapshots', require('./routes/WmsSnapshots'));
app.use('/api/work-orders', require('./routes/WorkOrders'));
app.use('/api/maintenance-events', require('./routes/MaintenanceEvents'));
app.use('/api/telemetry', require('./routes/Telemetry'));

// AI + cross-cutting
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom views (mounted BEFORE any 404 handler)
app.use('/api/custom-views', require('./routes/customViews'));

// Apply pass 7: backlog routes (mounted BEFORE any 404 handler)
app.use('/api/scan-schedules', require('./routes/ScanSchedules'));
app.use('/api/audit-log', require('./routes/auditLog'));
app.use('/api/wms-live', require('./routes/wmsLive'));
app.use('/api/scan-proofs', require('./routes/scanProofs'));
app.use('/api/cross-dc-reconciliations', require('./routes/crossDcReconciliation'));
app.use('/api/technician-dispatches', require('./routes/technicianDispatch'));

app.listen(PORT, () => console.log(`\nInventory Drone Operations API on http://localhost:${PORT}\n`));
