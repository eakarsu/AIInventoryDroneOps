import React from 'react';
import AIPage from '../components/AIPage';
import { aiRouteOptimizer } from '../services/api';

export default function AIRouteOptimizerPage() {
  return (
    <AIPage
      title="AI · Route Optimizer"
      feature="route-optimizer"
      subtitle="Route Optimizer"
      inputs={[
        { key: 'warehouse', label: 'Warehouse', type: 'text', placeholder: '' },
        { key: 'targets', label: 'Targets', type: 'textarea', placeholder: '' },
        { key: 'drone_count', label: 'Drones', type: 'number', placeholder: '' }
      ]}
      run={(v) => aiRouteOptimizer(v)}
    />
  );
}
