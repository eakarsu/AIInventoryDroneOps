import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

const CRUD_LINKS = [
  { to: '/warehouses', label: 'Warehouses' },
  { to: '/drones', label: 'Drones' },
  { to: '/missions', label: 'Missions' },
  { to: '/scan-results', label: 'Scan Results' },
  { to: '/discrepancies', label: 'Discrepancies' },
  { to: '/zones', label: 'Zones' },
  { to: '/sku-master', label: 'SKU Master' },
  { to: '/wms-snapshots', label: 'WMS Snapshots' },
  { to: '/work-orders', label: 'Work Orders' },
  { to: '/maintenance-events', label: 'Maintenance Events' },
  { to: '/telemetry', label: 'Telemetry' },
  { to: '/scan-schedules', label: 'Scan Schedules' },
];

const AI_LINKS = [
  { to: '/ai/drone-mission-plan', label: 'AI · Plan Inventory Pass' },
  { to: '/ai/sku-reconcile', label: 'AI · Reconcile SKU Counts' },
  { to: '/ai/maintenance-forecast', label: 'AI · Maintenance Forecast' },
  { to: '/ai/anomaly-classify', label: 'AI · Anomaly Classifier' },
  { to: '/ai/route-optimizer', label: 'AI · Route Optimizer' },
  { to: '/ai/demand-forecast', label: 'AI · SKU Demand Forecast' },
  { to: '/ai/swarm-coordinator', label: 'AI · Swarm Coordinator' },
  { to: '/ai/exception-routing', label: 'AI · Exception Routing' },
  { to: '/ai/mis-pick-detect', label: 'AI · Mis-pick Detection' },
  { to: '/ai/slot-occupancy-forecast', label: 'AI · Slot Occupancy' },
  { to: '/ai/anomaly-narrate', label: 'AI · Anomaly Narrator' },
  { to: '/ai/scan-failure-rca', label: 'AI · Scan-failure RCA' },
  { to: '/ai/photo-damage-classify', label: 'AI · Photo Damage' },
];

const CUSTOM_LINKS = [
  { to: '/wb/live-map', label: 'Live Map' },
  { to: '/wb/discrepancy-inbox', label: 'Discrepancy Inbox' },
  { to: '/custom-views', label: 'Drone Inv Views' },
  { to: '/audit-log', label: 'Audit Log' },
  { to: '/wms-live', label: 'WMS Live Connector' },
  { to: '/scan-proofs', label: 'Scan Proof-of-Count' },
  { to: '/cross-dc-reconciliations', label: 'Cross-DC Reconciliation' },
  { to: '/technician-dispatches', label: 'Technician Dispatch' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>INVENTORY DRONE OPERATIONS</h1>
        <p>Indoor drones doing nightly inventory passes. Replace handheld scanner crews.</p>
      </div>
      <NavLink to="/" end>Dashboard</NavLink>
      <div className="sidebar-group-label">Data</div>
      {CRUD_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-group-label">AI Features</div>
      {AI_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      {CUSTOM_LINKS.length > 0 && <div className="sidebar-group-label">Workbenches</div>}
      {CUSTOM_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
