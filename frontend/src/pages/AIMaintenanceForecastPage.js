import React from 'react';
import AIPage from '../components/AIPage';
import { aiMaintenanceForecast } from '../services/api';

export default function AIMaintenanceForecastPage() {
  return (
    <AIPage
      title="AI · Maintenance Forecast"
      feature="maintenance-forecast"
      subtitle="Maintenance Forecast"
      inputs={[
        { key: 'fleet_state_text', label: 'Fleet Telemetry', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiMaintenanceForecast(v)}
    />
  );
}
