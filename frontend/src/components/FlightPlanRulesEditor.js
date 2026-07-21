import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4061/api';
const tokenKey = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'inventory_drone_ops_token';

const blankRule = () => ({
  zone: '',
  schedule: '0 2 * * *',
  altitude_m: 4.0,
  speed_mps: 1.2,
  priority: 'medium',
  active: true,
  notes: '',
});

const auth = () => ({ Authorization: 'Bearer ' + (localStorage.getItem(tokenKey) || '') });

export default function FlightPlanRulesEditor() {
  const [rules, setRules] = useState([]);
  const [err, setErr] = useState(null);
  const [draft, setDraft] = useState(blankRule());
  const [editingId, setEditingId] = useState(null);

  const load = () =>
    fetch(`${API_BASE}/custom-views/flight-plan-rules`, { headers: auth() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((d) => setRules(d.rules || []))
      .catch((e) => setErr(e.message));

  useEffect(() => { load(); }, []);

  const save = async () => {
    setErr(null);
    const url = editingId
      ? `${API_BASE}/custom-views/flight-plan-rules/${editingId}`
      : `${API_BASE}/custom-views/flight-plan-rules`;
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Save failed');
      return;
    }
    setDraft(blankRule());
    setEditingId(null);
    load();
  };

  const edit = (rule) => {
    setEditingId(rule.id);
    setDraft({ ...rule });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete rule #' + id + '?')) return;
    const res = await fetch(`${API_BASE}/custom-views/flight-plan-rules/${id}`, {
      method: 'DELETE',
      headers: auth(),
    });
    if (!res.ok) {
      setErr('Delete failed');
      return;
    }
    load();
  };

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="card" data-testid="flight-plan-rules-editor">
      <h3 style={{ margin: '0 0 8px', color: '#cbd5e1' }}>Flight Plan Rules Editor</h3>
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
        CRUD for zones and scan schedules. Stored server-side.
      </p>
      {err && <div className="ai-error">{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        <input placeholder="Zone (e.g. A-North)" value={draft.zone} onChange={(e) => set('zone', e.target.value)} />
        <input placeholder="Cron schedule" value={draft.schedule} onChange={(e) => set('schedule', e.target.value)} />
        <input
          placeholder="Altitude m"
          type="number"
          step="0.1"
          value={draft.altitude_m}
          onChange={(e) => set('altitude_m', parseFloat(e.target.value))}
        />
        <input
          placeholder="Speed m/s"
          type="number"
          step="0.1"
          value={draft.speed_mps}
          onChange={(e) => set('speed_mps', parseFloat(e.target.value))}
        />
        <select value={draft.priority} onChange={(e) => set('priority', e.target.value)}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <label style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={!!draft.active} onChange={(e) => set('active', e.target.checked)} />
          Active
        </label>
        <input
          placeholder="Notes"
          value={draft.notes}
          onChange={(e) => set('notes', e.target.value)}
          style={{ gridColumn: 'span 2' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn" onClick={save}>{editingId ? 'Update Rule' : 'Add Rule'}</button>
        {editingId && (
          <button className="btn secondary" onClick={() => { setDraft(blankRule()); setEditingId(null); }}>
            Cancel
          </button>
        )}
      </div>

      <table style={{ width: '100%', color: '#cbd5e1', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
            <th>ID</th><th>Zone</th><th>Schedule</th><th>Alt</th><th>Speed</th><th>Priority</th><th>Active</th><th>Notes</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #1e293b' }}>
              <td>{r.id}</td>
              <td>{r.zone}</td>
              <td><code>{r.schedule}</code></td>
              <td>{r.altitude_m}</td>
              <td>{r.speed_mps}</td>
              <td>{r.priority}</td>
              <td>{r.active ? 'yes' : 'no'}</td>
              <td>{r.notes}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn secondary" style={{ marginRight: 6 }} onClick={() => edit(r)}>Edit</button>
                <button className="btn secondary" onClick={() => remove(r.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
