import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { path: '/warehouses', title: 'Warehouses', icon: 'W', color: '#3b82f6', desc: 'Manage warehouses.' },
  { path: '/drones', title: 'Drones', icon: 'D', color: '#3b82f6', desc: 'Manage drones.' },
  { path: '/missions', title: 'Missions', icon: 'M', color: '#3b82f6', desc: 'Manage missions.' },
  { path: '/scan-results', title: 'Scan Results', icon: 'C', color: '#3b82f6', desc: 'Manage scan results.' },
  { path: '/discrepancies', title: 'Discrepancies', icon: 'X', color: '#3b82f6', desc: 'Manage discrepancies.' },
  { path: '/zones', title: 'Zones', icon: 'Z', color: '#3b82f6', desc: 'Manage zones.' },
  { path: '/sku-master', title: 'SKU Master', icon: 'S', color: '#3b82f6', desc: 'Manage sku master.' },
  { path: '/wms-snapshots', title: 'WMS Snapshots', icon: 'N', color: '#3b82f6', desc: 'Manage wms snapshots.' },
  { path: '/work-orders', title: 'Work Orders', icon: 'O', color: '#3b82f6', desc: 'Manage work orders.' },
  { path: '/maintenance-events', title: 'Maintenance Events', icon: 'V', color: '#3b82f6', desc: 'Manage maintenance events.' },
  { path: '/telemetry', title: 'Telemetry', icon: 'T', color: '#3b82f6', desc: 'Manage telemetry.' },
  { path: '/ai/drone-mission-plan', title: 'AI · Plan Inventory Pass', icon: '*', color: '#8b5cf6', desc: 'Plan Inventory Pass' },
  { path: '/ai/sku-reconcile', title: 'AI · Reconcile SKU Counts', icon: '*', color: '#8b5cf6', desc: 'Reconcile SKU Counts' },
  { path: '/ai/maintenance-forecast', title: 'AI · Maintenance Forecast', icon: '*', color: '#8b5cf6', desc: 'Maintenance Forecast' },
  { path: '/ai/anomaly-classify', title: 'AI · Anomaly Classifier', icon: '*', color: '#8b5cf6', desc: 'Anomaly Classifier' },
  { path: '/ai/route-optimizer', title: 'AI · Route Optimizer', icon: '*', color: '#8b5cf6', desc: 'Route Optimizer' },
  { path: '/ai/demand-forecast', title: 'AI · SKU Demand Forecast', icon: '*', color: '#8b5cf6', desc: 'SKU Demand Forecast' },
  { path: '/ai/swarm-coordinator', title: 'AI · Swarm Coordinator', icon: '*', color: '#8b5cf6', desc: 'Swarm Coordinator' },
  { path: '/ai/exception-routing', title: 'AI · Exception Routing', icon: '*', color: '#8b5cf6', desc: 'Exception Routing' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { getDashboardStats().then(setStats).catch((e) => setErr(e.message)); }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Inventory Drone Operations</h2>
        <p>Indoor drones doing nightly inventory passes. Replace handheld scanner crews.</p>
      </div>
      {err && <div className="ai-error">Stats unavailable: {err}</div>}
      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Warehouses</div><div className="stat-value">{stats.warehouses?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Drones</div><div className="stat-value">{stats.drones?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Missions</div><div className="stat-value">{stats.missions?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Scan Results</div><div className="stat-value">{stats.scan_results?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Discrepancies</div><div className="stat-value">{stats.discrepancies?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Zones</div><div className="stat-value">{stats.zones?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">SKU Master</div><div className="stat-value">{stats.sku_master?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">WMS Snapshots</div><div className="stat-value">{stats.wms_snapshots?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Work Orders</div><div className="stat-value">{stats.work_orders?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Maintenance Events</div><div className="stat-value">{stats.maintenance_events?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Telemetry</div><div className="stat-value">{stats.telemetry?.total ?? '—'}</div></div>
        </div>
      )}
      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.path} className="feature-card" style={{ ['--card-color']: f.color }} onClick={() => navigate(f.path)}>
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
