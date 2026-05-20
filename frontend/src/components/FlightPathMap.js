import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:4061/api';
const tokenKey = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'inventory_drone_ops_token';

export default function FlightPathMap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const load = () =>
      fetch(`${API_BASE}/custom-views/flight-paths`, {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem(tokenKey) || '') },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
        .then(setData)
        .catch((e) => setErr(e.message));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (err) return <div className="ai-error">Flight paths: {err}</div>;
  if (!data) return <div style={{ color: '#94a3b8' }}>Loading flight paths…</div>;

  const W = 640;
  const H = 360;
  const b = data.bounds;
  const proj = (lat, lng) => {
    const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * (W - 40) + 20;
    const y = H - (((lat - b.minLat) / (b.maxLat - b.minLat)) * (H - 40) + 20);
    return [x, y];
  };

  return (
    <div className="card" data-testid="flight-path-map">
      <h3 style={{ margin: '0 0 8px', color: '#cbd5e1' }}>Drone Flight Path Map</h3>
      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
        Center {data.center.lat.toFixed(4)}, {data.center.lng.toFixed(4)} · {data.paths.length} drones
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', background: '#0b1424', border: '1px solid #1e293b', borderRadius: 8 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {data.paths.map((p) => {
          const pts = p.waypoints.map((w) => proj(w.lat, w.lng));
          const poly = pts.map((q) => q.join(',')).join(' ');
          return (
            <g key={p.drone_id}>
              <polyline points={poly} fill="none" stroke={p.color} strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
              {pts.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={p.waypoints[i].scanned ? 6 : 4}
                  fill={p.waypoints[i].scanned ? p.color : '#0b1424'}
                  stroke={p.color}
                  strokeWidth="2"
                />
              ))}
              <text x={pts[0][0] + 8} y={pts[0][1] - 8} fill={p.color} fontSize="11" fontWeight="600">
                {p.drone_id} · {p.zone} · {p.battery_pct}%
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
        {data.paths.map((p) => (
          <div key={p.drone_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#cbd5e1' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
            {p.drone_id} ({p.status})
          </div>
        ))}
      </div>
    </div>
  );
}
