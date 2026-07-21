const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  return secret;
}

const authenticateToken = (req, res, next) => {
  const h = req.headers['authorization'];
  const token = h && h.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try { req.user = jwt.verify(token, getJwtSecret()); next(); }
  catch (e) { return res.status(403).json({ error: 'Invalid or expired token' }); }
};

const ROLES = ['viewer', 'analyst', 'operator', 'safety_officer', 'commander'];
function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role || 'viewer';
    if (!allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
const requireWriter = requireRole('commander', 'analyst');
const requireCommander = requireRole('commander');

module.exports = { authenticateToken, getJwtSecret, ROLES, requireRole, requireWriter, requireCommander };
