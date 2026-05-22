import React, { useEffect, useState } from 'react';
import { scanProofsApi } from '../services/api';

export default function ScanProofsPage() {
  const [rows, setRows] = useState([]);
  const [missionRef, setMissionRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastProof, setLastProof] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setRows(await scanProofsApi.list()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!missionRef) { setError('mission_id_ref required'); return; }
    setLoading(true); setError(null);
    try {
      const r = await scanProofsApi.generate({ mission_id_ref: missionRef });
      setLastProof(r);
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Scan Proof-of-Count</h2><p>Deterministic SHA-256 Merkle root per scan session. Anchors immutable evidence on each cycle count.</p></div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Mission ID (mission_id_ref on scan_results)</label>
            <input value={missionRef} onChange={(e) => setMissionRef(e.target.value)} placeholder="MSN-001" />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button className="btn" onClick={generate} disabled={loading}>{loading ? 'Generating...' : 'Generate Merkle proof'}</button>
          </div>
        </div>
        {error && <div className="ai-error">{error}</div>}
        {lastProof && (
          <div style={{ marginTop: 12 }}>
            <strong>Latest proof:</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(lastProof, null, 2)}</pre>
          </div>
        )}
      </div>
      <div className="card">
        <h3>Existing proofs</h3>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Mission</th><th>Scans</th><th>Root</th><th>Algorithm</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.mission_id_ref}</td>
                <td>{r.scan_count}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{(r.merkle_root || '').slice(0, 16)}…</td>
                <td>{r.algorithm}</td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty-state">No proofs yet — generate one above.</div>}
      </div>
    </div>
  );
}
