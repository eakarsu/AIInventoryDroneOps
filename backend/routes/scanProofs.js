// Blockchain-style proof-of-count via deterministic SHA-256 Merkle tree per scan session.
// No external chain; root hash + leaves persisted in scan_proofs.
const express = require('express');
const crypto = require('crypto');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const router = express.Router();
const ALGO = 'sha256-merkle-v1';

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function leafHash(scan) {
  // Canonical, deterministic serialization.
  const canon = JSON.stringify({
    mission_id_ref: scan.mission_id_ref ?? null,
    sku: scan.sku ?? null,
    location: scan.location ?? null,
    quantity: scan.quantity ?? null,
    scanned_at: scan.scanned_at ?? null,
  });
  return sha256(canon);
}

function buildMerkle(leaves) {
  if (!leaves.length) return { root: sha256(''), levels: [[sha256('')]] };
  const levels = [leaves.slice()];
  let cur = leaves.slice();
  while (cur.length > 1) {
    const next = [];
    for (let i = 0; i < cur.length; i += 2) {
      const a = cur[i];
      const b = i + 1 < cur.length ? cur[i + 1] : cur[i]; // duplicate last if odd
      next.push(sha256(a + b));
    }
    levels.push(next);
    cur = next;
  }
  return { root: cur[0], levels };
}

function proofFor(levels, leafIndex) {
  const proof = [];
  let idx = leafIndex;
  for (let level = 0; level < levels.length - 1; level++) {
    const arr = levels[level];
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : (idx + 1 < arr.length ? idx + 1 : idx);
    proof.push({ position: isRight ? 'left' : 'right', hash: arr[siblingIdx] });
    idx = Math.floor(idx / 2);
  }
  return proof;
}

// POST /api/scan-proofs/generate — build proof from scan_results for a mission_id_ref.
router.post('/generate', requireWriter, async (req, res) => {
  try {
    const missionRef = (req.body && req.body.mission_id_ref) ? String(req.body.mission_id_ref) : null;
    const inlineScans = Array.isArray(req.body && req.body.scans) ? req.body.scans : null;
    if (!missionRef && !inlineScans) {
      return res.status(400).json({ error: 'mission_id_ref or scans[] required' });
    }
    let scans = inlineScans;
    if (!scans) {
      const r = await pool.query(
        'SELECT mission_id_ref, sku, location, quantity, scanned_at FROM scan_results WHERE mission_id_ref = $1 ORDER BY id ASC',
        [missionRef]
      );
      scans = r.rows;
    }
    if (!scans.length) return res.status(400).json({ error: 'no scans found for proof' });

    const leaves = scans.map(leafHash);
    const { root, levels } = buildMerkle(leaves);
    const ins = await pool.query(
      `INSERT INTO scan_proofs (mission_id_ref, scan_count, merkle_root, algorithm, leaves, metadata)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [missionRef, scans.length, root, ALGO, JSON.stringify(leaves), JSON.stringify({ levels_count: levels.length })]
    );
    res.status(201).json({
      proof: ins.rows[0],
      merkle_root: root,
      algorithm: ALGO,
      scan_count: scans.length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/scan-proofs — list recent proofs
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const r = await pool.query(
      'SELECT id, mission_id_ref, scan_count, merkle_root, algorithm, metadata, created_at FROM scan_proofs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/scan-proofs/:id — full proof with leaves
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM scan_proofs WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/scan-proofs/:id/verify — verify a leaf belongs to the stored root.
// body: { scan: {...} }  OR  { leaf_hash: "..." }
router.post('/:id/verify', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM scan_proofs WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    const row = r.rows[0];
    const leaves = Array.isArray(row.leaves) ? row.leaves : JSON.parse(row.leaves || '[]');
    const targetHash = req.body && req.body.leaf_hash ? String(req.body.leaf_hash) : (req.body && req.body.scan ? leafHash(req.body.scan) : null);
    if (!targetHash) return res.status(400).json({ error: 'scan or leaf_hash required' });
    const idx = leaves.indexOf(targetHash);
    if (idx === -1) return res.json({ verified: false, reason: 'leaf not in tree', leaf_hash: targetHash, merkle_root: row.merkle_root });
    const { root, levels } = buildMerkle(leaves);
    const proof = proofFor(levels, idx);
    res.json({
      verified: root === row.merkle_root,
      merkle_root: row.merkle_root,
      recomputed_root: root,
      leaf_hash: targetHash,
      leaf_index: idx,
      proof_path: proof,
      algorithm: ALGO,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
