import React from 'react';
import AIPage from '../components/AIPage';
import { aiDemandForecast } from '../services/api';

export default function AIDemandForecastPage() {
  return (
    <AIPage
      title="AI · SKU Demand Forecast"
      feature="demand-forecast"
      subtitle="SKU Demand Forecast"
      inputs={[
        { key: 'sku_history_text', label: 'SKU History (csv)', type: 'textarea', placeholder: '' },
        { key: 'horizon_days', label: 'Horizon (days)', type: 'number', placeholder: '' }
      ]}
      run={(v) => aiDemandForecast(v)}
    />
  );
}
