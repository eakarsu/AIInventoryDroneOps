import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4061/api';
const tokenKey = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'inventory_drone_ops_token';

function heatColor(pct) {
  // 0 = red, 50 = amber, 100 = green
  const r = pct < 50 ? 239 : Math.round(239 - (pct - 50) * 4.4);
  const g = pct < 50 ? Math.round(100 + pct * 2) : 197;
  const b = pct < 50 ? 68 : 94;
  return `rgb(${r},${g},${b})`;
}

export default function ZoneScanHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/custom-views/zone-scan-heatmap`, {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem(tokenKey) || '') },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="ai-error">Heatmap: {err}</div>;
  if (!data) return <div style={{ color: '#94a3b8' }}>Loading heatmap…</div>;

  const cellW = 70;
  const cellH = 50;

  return (
    <div className="card" data-testid="zone-scan-heatmap">
      <h3 style={{ margin: '0 0 8px', color: '#cbd5e1' }}>Warehouse Zone Scan Heatmap</h3>
      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
        Avg {data.summary.avg_scan_pct}% · {data.summary.uncovered} cells under 50%
      </div>
      <div style={{ display: 'inline-block', border: '1px solid #1e293b', borderRadius: 8, padding: 8, background: '#0b1424' }}>
        {Array.from({ length: data.rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {Array.from({ length: data.cols }).map((__, c) => {
              const cell = data.cells.find((x) => x.row === r && x.col === c);
              return (
                <div
                  key={c}
                  onMouseEnter={() => setHover(cell)}
                  onMouseLeave={() => setHover(null)}
                  title={`${cell.zone}: ${cell.scan_pct}% (${cell.discrepancies} disc)`}
                  style={{
                    width: cellW,
                    height: cellH,
                    margin: 2,
                    background: heatColor(cell.scan_pct),
                    borderRadius: 4,
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>{cell.zone}</div>
                  <div style={{ fontSize: 11 }}>{cell.scan_pct}%</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, color: '#cbd5e1', fontSize: 13 }}>
        {hover ? (
          <span>
            Zone <b>{hover.zone}</b> · scan {hover.scan_pct}% · discrepancies {hover.discrepancies} ·{' '}
            {hover.last_scanned ? new Date(hover.last_scanned).toLocaleTimeString() : 'never'}
          </span>
        ) : (
          <span style={{ color: '#64748b' }}>Hover a cell for details.</span>
        )}
      </div>
    </div>
  );
}
