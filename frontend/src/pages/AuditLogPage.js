import React, { useEffect, useState } from 'react';
import { getAuditLog } from '../services/api';

export default function AuditLogPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actor, setActor] = useState('');
  const [resource, setResource] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (actor) params.actor = actor;
      if (resource) params.resource = resource;
      params.limit = 200;
      const data = await getAuditLog(params);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="page-header">
        <div><h2>Audit Log</h2><p>Mutating actions captured by middleware.</p></div>
        <div className="page-header-actions">
          <button className="btn secondary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-grid">
          <div className="form-group"><label>Actor email</label><input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="user@example.com" /></div>
          <div className="form-group"><label>Resource</label><input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="warehouses" /></div>
          <div className="form-group"><label>&nbsp;</label><button className="btn" onClick={load}>Apply Filter</button></div>
        </div>
      </div>
      {error && <div className="ai-error">{error}</div>}
      <div className="card">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Time</th><th>Actor</th><th>Role</th><th>Method</th><th>Path</th><th>Status</th><th>Resource</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
                <td>{r.actor_email || '—'}</td>
                <td>{r.actor_role || '—'}</td>
                <td>{r.method}</td>
                <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.path}</td>
                <td>{r.status_code}</td>
                <td>{r.resource_type}{r.resource_id ? `/${r.resource_id}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading && <div className="empty-state">No audit records yet.</div>}
      </div>
    </div>
  );
}
