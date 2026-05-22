// Write-through audit middleware. Logs every mutating request after it completes.
const pool = require('../config/database');

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Paths we never want to audit (auth flow, health checks, audit reads).
const SKIP_PATHS = [/^\/api\/health/, /^\/api\/auth\/login/, /^\/api\/audit-log/];

function shouldAudit(req) {
  if (!MUTATING.has(req.method)) return false;
  const url = req.originalUrl || req.url || '';
  return !SKIP_PATHS.some((rx) => rx.test(url));
}

function resourceFromPath(url) {
  // /api/<resource>/<id>?
  const m = (url || '').match(/^\/api\/([^/?]+)(?:\/([^/?]+))?/);
  if (!m) return { resource_type: null, resource_id: null };
  return { resource_type: m[1] || null, resource_id: m[2] || null };
}

function auditLog(req, res, next) {
  if (!shouldAudit(req)) return next();
  const start = Date.now();
  res.on('finish', () => {
    try {
      const { resource_type, resource_id } = resourceFromPath(req.originalUrl || req.url);
      const payload = req.body && typeof req.body === 'object' ? req.body : null;
      pool.query(
        `INSERT INTO audit_log (actor_email, actor_role, method, path, status_code, resource_type, resource_id, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          req.user?.email || null,
          req.user?.role || null,
          req.method,
          (req.originalUrl || req.url || '').slice(0, 500),
          res.statusCode,
          resource_type,
          resource_id,
          payload,
        ]
      ).catch(() => {});
    } catch (_) { /* never block on audit */ }
    // duration is recorded only implicitly via created_at; start kept for future use.
    void start;
  });
  next();
}

module.exports = { auditLog };
