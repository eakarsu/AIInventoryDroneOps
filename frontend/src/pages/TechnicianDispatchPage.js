import React, { useEffect, useState } from 'react';
import { technicianDispatchApi } from '../services/api';

export default function TechnicianDispatchPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discrepancyId, setDiscrepancyId] = useState('');
  const [tech, setTech] = useState('');
  const [anomaly, setAnomaly] = useState({ severity: 'high', summary: '', source_id: '' });

  const load = async () => {
    setLoading(true); setError(null);
    try { setRows(await technicianDispatchApi.list()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const dispatchDisc = async () => {
    if (!discrepancyId) { setError('discrepancy id required'); return; }
    setLoading(true); setError(null);
    try {
      await technicianDispatchApi.fromDiscrepancy(discrepancyId, tech ? { technician: tech } : {});
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const dispatchAnomaly = async () => {
    setLoading(true); setError(null);
    try {
      await technicianDispatchApi.fromAnomaly(anomaly);
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Technician Auto-Dispatch</h2><p>Convert discrepancies/anomalies into a work order + assigned technician.</p></div>
      </div>
      {error && <div className="ai-error">{error}</div>}
      <div className="card" style={{ marginBottom: 12 }}>
        <h3>From discrepancy</h3>
        <div className="form-grid">
          <div className="form-group"><label>Discrepancy ID</label><input value={discrepancyId} onChange={(e) => setDiscrepancyId(e.target.value)} /></div>
          <div className="form-group"><label>Technician (optional)</label><input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="auto-assign" /></div>
          <div className="form-group"><label>&nbsp;</label><button className="btn" onClick={dispatchDisc} disabled={loading}>Dispatch</button></div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <h3>From anomaly</h3>
        <div className="form-grid">
          <div className="form-group"><label>Source ID</label><input value={anomaly.source_id} onChange={(e) => setAnomaly({ ...anomaly, source_id: e.target.value })} /></div>
          <div className="form-group">
            <label>Severity</label>
            <select value={anomaly.severity} onChange={(e) => setAnomaly({ ...anomaly, severity: e.target.value })}>
              <option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option>
            </select>
          </div>
          <div className="form-group full-width"><label>Summary</label><textarea value={anomaly.summary} onChange={(e) => setAnomaly({ ...anomaly, summary: e.target.value })} /></div>
          <div className="form-group"><label>&nbsp;</label><button className="btn" onClick={dispatchAnomaly} disabled={loading}>Dispatch</button></div>
        </div>
      </div>
      <div className="card">
        <h3>Recent dispatches</h3>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Source</th><th>Technician</th><th>Severity</th><th>WO</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.source_type}/{r.source_id ?? '—'}</td>
                <td>{r.technician}</td>
                <td>{r.severity}</td>
                <td>{r.work_order_id}</td>
                <td>{r.status}</td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty-state">No dispatches yet.</div>}
      </div>
    </div>
  );
}
