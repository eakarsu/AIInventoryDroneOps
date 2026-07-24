const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getJwtSecret, authenticateToken, requireCommander } = require('../middleware/auth');
const pool = require('../config/database');

function verifyDigest(password, digest) {
  const [scheme, salt, expected] = String(digest || '').split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const actual = crypto.scryptSync(String(password), salt, 64).toString('hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

async function findDbUser(email, password) {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.password_digest, u.password, m.tenant_id, m.role
     FROM users u JOIN tenant_memberships m ON m.user_id=u.id AND m.active=TRUE
     WHERE LOWER(u.email)=LOWER($1) LIMIT 1`,
    [email]
  );
  if (!result.rows.length) return null;
  const user = result.rows[0];
  let valid = verifyDigest(password, user.password_digest);
  const legacyAllowed = process.env.NODE_ENV !== 'production' && process.env.ALLOW_LEGACY_PASSWORDS === 'true';
  if (!valid && legacyAllowed && user.password) {
    const left = Buffer.from(String(user.password));
    const right = Buffer.from(String(password));
    valid = left.length === right.length && crypto.timingSafeEqual(left, right);
  }
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenant_id };
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await findDbUser(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign(user, getJwtSecret(), { expiresIn: process.env.JWT_TTL || '1h', issuer: 'inventory-drone-ops' });
    res.json({ token, user });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role, tenantId: req.user.tenantId });
});

router.get('/users', authenticateToken, requireCommander, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY id ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
