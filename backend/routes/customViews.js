// customViews.js
// Custom views for AIInventoryDroneOps:
//  VIZ:    GET /flight-paths         - drone flight path map (geo + waypoints)
//          GET /zone-scan-heatmap    - warehouse zone scan completeness heatmap
//  NON-VIZ:GET /scan-report.pdf      - inventory scan report PDF (lightweight, hand-built)
//          GET/POST/PUT/DELETE /flight-plan-rules - CRUD zone + schedule rules
const express = require('express');
const router = express.Router();

// ───────────── In-memory store for flight plan rules (zones + schedules) ─────────────
let RULE_SEQ = 4;
const FLIGHT_PLAN_RULES = [
  { id: 1, zone: 'A-North',  schedule: '0 2 * * *',  altitude_m: 4.5, speed_mps: 1.2, priority: 'high',   active: true,  notes: 'Nightly pass, high-value SKUs' },
  { id: 2, zone: 'B-Center', schedule: '0 3 * * *',  altitude_m: 4.0, speed_mps: 1.5, priority: 'medium', active: true,  notes: 'Bulk pallet aisles' },
  { id: 3, zone: 'C-Cold',   schedule: '0 4 * * 1-5',altitude_m: 3.8, speed_mps: 1.0, priority: 'high',   active: true,  notes: 'Cold-storage, weekdays only' },
];

// ───────────── 1) VIZ: drone flight path map ─────────────
router.get('/flight-paths', (_req, res) => {
  const center = { lat: 40.6892, lng: -74.0445 }; // Warehouse complex (Bayonne, NJ)
  const paths = [
    {
      drone_id: 'DRN-001',
      zone: 'A-North',
      color: '#3b82f6',
      status: 'in-flight',
      battery_pct: 78,
      waypoints: [
        { id: 'w1', lat: 40.6895, lng: -74.0448, alt_m: 4.5, scanned: true },
        { id: 'w2', lat: 40.6896, lng: -74.0444, alt_m: 4.5, scanned: true },
        { id: 'w3', lat: 40.6894, lng: -74.0441, alt_m: 4.5, scanned: false },
        { id: 'w4', lat: 40.6891, lng: -74.0442, alt_m: 4.5, scanned: false },
      ],
    },
    {
      drone_id: 'DRN-002',
      zone: 'B-Center',
      color: '#10b981',
      status: 'in-flight',
      battery_pct: 63,
      waypoints: [
        { id: 'w1', lat: 40.6890, lng: -74.0450, alt_m: 4.0, scanned: true },
        { id: 'w2', lat: 40.6888, lng: -74.0446, alt_m: 4.0, scanned: true },
        { id: 'w3', lat: 40.6886, lng: -74.0444, alt_m: 4.0, scanned: true },
        { id: 'w4', lat: 40.6885, lng: -74.0440, alt_m: 4.0, scanned: false },
      ],
    },
    {
      drone_id: 'DRN-003',
      zone: 'C-Cold',
      color: '#f59e0b',
      status: 'returning',
      battery_pct: 24,
      waypoints: [
        { id: 'w1', lat: 40.6893, lng: -74.0438, alt_m: 3.8, scanned: true },
        { id: 'w2', lat: 40.6891, lng: -74.0435, alt_m: 3.8, scanned: true },
        { id: 'w3', lat: 40.6889, lng: -74.0437, alt_m: 3.8, scanned: true },
      ],
    },
  ];
  res.json({
    center,
    bounds: { minLat: 40.6885, maxLat: 40.6896, minLng: -74.0450, maxLng: -74.0435 },
    paths,
    generated_at: new Date().toISOString(),
  });
});

// ───────────── 2) VIZ: warehouse zone scan heatmap ─────────────
router.get('/zone-scan-heatmap', (_req, res) => {
  // 6x8 grid of zone cells (aisles x bays). Each cell = scan_completeness %.
  const cols = 8;
  const rows = 6;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // deterministic pseudo-random for stable UI
      const seed = (r * 17 + c * 31 + 7) % 100;
      const pct = Math.max(0, Math.min(100, seed + ((c + r) % 3) * 5));
      cells.push({
        row: r,
        col: c,
        aisle: String.fromCharCode(65 + r),    // A..F
        bay: c + 1,
        zone: `${String.fromCharCode(65 + r)}-${c + 1}`,
        scan_pct: pct,
        last_scanned: pct > 0 ? new Date(Date.now() - (100 - pct) * 60_000).toISOString() : null,
        discrepancies: Math.max(0, Math.round((100 - pct) / 20)),
      });
    }
  }
  res.json({
    rows,
    cols,
    cells,
    summary: {
      total_cells: cells.length,
      avg_scan_pct: Math.round(cells.reduce((s, x) => s + x.scan_pct, 0) / cells.length),
      uncovered: cells.filter((x) => x.scan_pct < 50).length,
    },
    generated_at: new Date().toISOString(),
  });
});

// ───────────── 3) NON-VIZ: scan report PDF ─────────────
// Minimal hand-built PDF (no external deps). Renders scan summary text.
router.get('/scan-report.pdf', (_req, res) => {
  const now = new Date();
  const lines = [
    'AIInventoryDroneOps - Inventory Scan Report',
    `Generated: ${now.toISOString()}`,
    '',
    'Summary',
    '  Active drones:           3',
    '  Zones scanned tonight:   12',
    '  Discrepancies flagged:   7',
    '  Avg scan completeness:   84%',
    '',
    'Top Discrepancies',
    '  SKU-10044  Bay B-3   expected 24  found 19   -5',
    '  SKU-22910  Bay A-1   expected 60  found 58   -2',
    '  SKU-30007  Bay C-2   expected 12  found 14   +2',
    '',
    'Recommended Actions',
    '  - Re-run pass on B-3 with DRN-002',
    '  - Sync WMS snapshot for SKU-22910',
    '  - Open work order for SKU-30007 overage',
  ];

  // Build the minimal PDF body
  const fontObj = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let y = 760;
  let stream = 'BT\n/F1 12 Tf\n14 TL\n';
  stream += `1 0 0 1 60 ${y} Tm\n`;
  for (const l of lines) {
    const safe = l.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    stream += `(${safe}) Tj\nT*\n`;
  }
  stream += 'ET';

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
  objects.push(fontObj);

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="inventory-scan-report.pdf"');
  res.send(Buffer.from(pdf, 'utf8'));
});

// ───────────── 4) NON-VIZ: flight-plan rules CRUD ─────────────
router.get('/flight-plan-rules', (_req, res) => {
  res.json({ rules: FLIGHT_PLAN_RULES });
});

router.post('/flight-plan-rules', (req, res) => {
  const body = req.body || {};
  if (!body.zone || !body.schedule) {
    return res.status(400).json({ error: 'zone and schedule are required' });
  }
  const rule = {
    id: RULE_SEQ++,
    zone: String(body.zone),
    schedule: String(body.schedule),
    altitude_m: Number(body.altitude_m ?? 4.0),
    speed_mps: Number(body.speed_mps ?? 1.2),
    priority: body.priority || 'medium',
    active: body.active !== false,
    notes: body.notes || '',
  };
  FLIGHT_PLAN_RULES.push(rule);
  res.status(201).json(rule);
});

router.put('/flight-plan-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = FLIGHT_PLAN_RULES.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  FLIGHT_PLAN_RULES[idx] = { ...FLIGHT_PLAN_RULES[idx], ...(req.body || {}), id };
  res.json(FLIGHT_PLAN_RULES[idx]);
});

router.delete('/flight-plan-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = FLIGHT_PLAN_RULES.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  const [removed] = FLIGHT_PLAN_RULES.splice(idx, 1);
  res.json({ message: 'deleted', rule: removed });
});

module.exports = router;
