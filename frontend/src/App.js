import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import WarehousesPage from './pages/WarehousesPage';
import DronesPage from './pages/DronesPage';
import MissionsPage from './pages/MissionsPage';
import ScanResultsPage from './pages/ScanResultsPage';
import DiscrepanciesPage from './pages/DiscrepanciesPage';
import ZonesPage from './pages/ZonesPage';
import SkuMasterPage from './pages/SkuMasterPage';
import WmsSnapshotsPage from './pages/WmsSnapshotsPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import MaintenanceEventsPage from './pages/MaintenanceEventsPage';
import TelemetryPage from './pages/TelemetryPage';
import AIDroneMissionPlanPage from './pages/AIDroneMissionPlanPage';
import AISkuReconcilePage from './pages/AISkuReconcilePage';
import AIMaintenanceForecastPage from './pages/AIMaintenanceForecastPage';
import AIAnomalyClassifyPage from './pages/AIAnomalyClassifyPage';
import AIRouteOptimizerPage from './pages/AIRouteOptimizerPage';
import AIDemandForecastPage from './pages/AIDemandForecastPage';
import AISwarmCoordinatorPage from './pages/AISwarmCoordinatorPage';
import AIExceptionRoutingPage from './pages/AIExceptionRoutingPage';
import LiveMapWorkbench from './pages/LiveMapWorkbench';
import DiscrepancyInboxWorkbench from './pages/DiscrepancyInboxWorkbench';
import CustomViewsPage from './pages/CustomViewsPage';
import { getToken } from './services/api';
import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// Apply pass 7: backlog pages
import AIMisPickDetectPage from './pages/AIMisPickDetectPage';
import AISlotOccupancyForecastPage from './pages/AISlotOccupancyForecastPage';
import AIAnomalyNarratePage from './pages/AIAnomalyNarratePage';
import AIScanFailureRcaPage from './pages/AIScanFailureRcaPage';
import AIPhotoDamageClassifyPage from './pages/AIPhotoDamageClassifyPage';
import ScanSchedulesPage from './pages/ScanSchedulesPage';
import AuditLogPage from './pages/AuditLogPage';
import WmsLivePage from './pages/WmsLivePage';
import ScanProofsPage from './pages/ScanProofsPage';
import CrossDcReconciliationPage from './pages/CrossDcReconciliationPage';
import TechnicianDispatchPage from './pages/TechnicianDispatchPage';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function Shell() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/" element={<Dashboard />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/drones" element={<DronesPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/scan-results" element={<ScanResultsPage />} />
            <Route path="/discrepancies" element={<DiscrepanciesPage />} />
            <Route path="/zones" element={<ZonesPage />} />
            <Route path="/sku-master" element={<SkuMasterPage />} />
            <Route path="/wms-snapshots" element={<WmsSnapshotsPage />} />
            <Route path="/work-orders" element={<WorkOrdersPage />} />
            <Route path="/maintenance-events" element={<MaintenanceEventsPage />} />
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/ai/drone-mission-plan" element={<AIDroneMissionPlanPage />} />
            <Route path="/ai/sku-reconcile" element={<AISkuReconcilePage />} />
            <Route path="/ai/maintenance-forecast" element={<AIMaintenanceForecastPage />} />
            <Route path="/ai/anomaly-classify" element={<AIAnomalyClassifyPage />} />
            <Route path="/ai/route-optimizer" element={<AIRouteOptimizerPage />} />
            <Route path="/ai/demand-forecast" element={<AIDemandForecastPage />} />
            <Route path="/ai/swarm-coordinator" element={<AISwarmCoordinatorPage />} />
            <Route path="/ai/exception-routing" element={<AIExceptionRoutingPage />} />
            <Route path="/wb/live-map" element={<LiveMapWorkbench />} />
            <Route path="/wb/discrepancy-inbox" element={<DiscrepancyInboxWorkbench />} />
            <Route path="/custom-views" element={<CustomViewsPage />} />
            <Route path="/ai/mis-pick-detect" element={<AIMisPickDetectPage />} />
            <Route path="/ai/slot-occupancy-forecast" element={<AISlotOccupancyForecastPage />} />
            <Route path="/ai/anomaly-narrate" element={<AIAnomalyNarratePage />} />
            <Route path="/ai/scan-failure-rca" element={<AIScanFailureRcaPage />} />
            <Route path="/ai/photo-damage-classify" element={<AIPhotoDamageClassifyPage />} />
            <Route path="/scan-schedules" element={<ScanSchedulesPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/wms-live" element={<WmsLivePage />} />
            <Route path="/scan-proofs" element={<ScanProofsPage />} />
            <Route path="/cross-dc-reconciliations" element={<CrossDcReconciliationPage />} />
            <Route path="/technician-dispatches" element={<TechnicianDispatchPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
      </Routes>
    </Router>
  );
}
