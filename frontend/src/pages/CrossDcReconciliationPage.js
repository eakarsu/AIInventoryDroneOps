import React, { useEffect, useState } from 'react';
import { crossDcApi } from '../services/api';

export default function CrossDcReconciliationPage() {
  const [rows, setRows] = useState([]);
  const [warehouses, setWarehouses] = useState('Reno DC, Memphis Hub, Newark FC');
  const [last, setLast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setRows(await crossDcApi.list()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const run = async () => {
    const list = warehouses.split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length < 2) { setError('Enter at least 2 warehouses (comma-separated)'); return; }
    setLoading(true); setError(null);
    try {
      const r = await crossDcApi.run({ warehouses: list });
      setLast(r);
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Cross-DC Reconciliation</h2><p>Aggregate scan totals across warehouses and surface SKU imbalances.</p></div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Warehouses (comma-separated)</label>
            <input value={warehouses} onChange={(e) => setWarehouses(e.target.value)} />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button className="btn" onClick={run} disabled={loading}>{loading ? 'Running...' : 'Run reconciliation'}</button>
          </div>
        </div>
        {error && <div className="ai-error">{error}</div>}
        {last && (
          <div style={{ marginTop: 12 }}>
            <strong>Latest run:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto' }}>{JSON.stringify(last, null, 2)}</pre>
          </div>
        )}
      </div>
      <div className="card">
        <h3>Previous runs</h3>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Warehouses</th><th>SKUs</th><th>Imbalances</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.warehouses}</td>
                <td>{r.sku_count}</td>
                <td>{r.imbalance_count}</td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty-state">No reconciliation runs yet.</div>}
      </div>
    </div>
  );
}
