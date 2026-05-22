import React, { useEffect, useState } from 'react';
import { wmsLive } from '../services/api';

export default function WmsLivePage() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setError(null); setLoading(true);
    try { setStatus(await wmsLive.status()); }
    catch (e) {
      // 503 is expected when unconfigured — parse body if available.
      try { setStatus(JSON.parse(e.message)); } catch (_) { setError(e.message); }
    } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const runAction = async (fn, name) => {
    setLoading(true); setError(null); setActionResult(null);
    try { setActionResult(await fn({})); }
    catch (e) { setActionResult({ action: name, error: e.message }); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>WMS Live Connector</h2><p>Live push/pull bridge to SAP EWM / Manhattan / Blue Yonder. Stub returns 503 until creds are wired.</p></div>
        <div className="page-header-actions">
          <button className="btn secondary" onClick={refresh} disabled={loading}>Refresh status</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <h3>Status</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(status, null, 2) || (error || 'loading...')}</pre>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <h3>Manual triggers</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" disabled={loading} onClick={() => runAction(wmsLive.pull, 'pull')}>Pull from WMS</button>
          <button className="btn" disabled={loading} onClick={() => runAction(wmsLive.push, 'push')}>Push to WMS</button>
          <button className="btn" disabled={loading} onClick={() => runAction(wmsLive.sync, 'sync')}>Full sync</button>
        </div>
      </div>
      {actionResult && (
        <div className="card">
          <h3>Last action</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(actionResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
