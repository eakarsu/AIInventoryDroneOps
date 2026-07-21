import React from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4061/api';
const tokenKey = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'inventory_drone_ops_token';

export default function InventoryScanReport() {
  const download = async () => {
    const res = await fetch(`${API_BASE}/custom-views/scan-report.pdf`, {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem(tokenKey) || '') },
    });
    if (!res.ok) {
      alert('Report failed: ' + res.status);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-scan-report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const preview = () => {
    window.open(`${API_BASE}/custom-views/scan-report.pdf?t=${Date.now()}`, '_blank', 'noopener');
  };

  return (
    <div className="card" data-testid="inventory-scan-report">
      <h3 style={{ margin: '0 0 8px', color: '#cbd5e1' }}>Inventory Scan Report (PDF)</h3>
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
        Server-rendered PDF summarising tonight's drone inventory pass, discrepancies and recommended
        follow-ups.
      </p>
      <ul style={{ color: '#cbd5e1', fontSize: 13, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Scan completeness per zone</li>
        <li>Top SKU-level discrepancies</li>
        <li>Recommended work orders</li>
      </ul>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn" onClick={download}>Download PDF</button>
        <button className="btn secondary" onClick={preview}>Open in browser</button>
      </div>
    </div>
  );
}
