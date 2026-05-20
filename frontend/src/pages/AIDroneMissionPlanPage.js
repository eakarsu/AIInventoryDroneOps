import React from 'react';
import AIPage from '../components/AIPage';
import { aiDroneMissionPlan } from '../services/api';

export default function AIDroneMissionPlanPage() {
  return (
    <AIPage
      title="AI · Plan Inventory Pass"
      feature="drone-mission-plan"
      subtitle="Plan Inventory Pass"
      inputs={[
        { key: 'warehouse', label: 'Warehouse / Zone', type: 'text', placeholder: '' },
        { key: 'sku_priority', label: 'SKU Priority', type: 'select', placeholder: '', options: ["all","high-velocity","cycle-count","exception-only"] },
        { key: 'time_window', label: 'Window', type: 'text', placeholder: '' }
      ]}
      run={(v) => aiDroneMissionPlan(v)}
    />
  );
}
