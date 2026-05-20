import React from 'react';
import FlightPathMap from '../components/FlightPathMap';
import ZoneScanHeatmap from '../components/ZoneScanHeatmap';
import InventoryScanReport from '../components/InventoryScanReport';
import FlightPlanRulesEditor from '../components/FlightPlanRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <div>
          <h2>Drone Inv Views</h2>
          <p>Custom views: flight paths, scan heatmap, scan report PDF, and flight plan rules.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FlightPathMap />
        <ZoneScanHeatmap />
      </div>
      <div style={{ height: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <InventoryScanReport />
        <FlightPlanRulesEditor />
      </div>
    </div>
  );
}
