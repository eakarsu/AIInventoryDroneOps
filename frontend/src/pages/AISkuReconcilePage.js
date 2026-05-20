import React from 'react';
import AIPage from '../components/AIPage';
import { aiSkuReconcile } from '../services/api';

export default function AISkuReconcilePage() {
  return (
    <AIPage
      title="AI · Reconcile SKU Counts"
      feature="sku-reconcile"
      subtitle="Reconcile SKU Counts"
      inputs={[
        { key: 'scan_results_text', label: 'Scan Results', type: 'textarea', placeholder: '' },
        { key: 'wms_expected_text', label: 'WMS Expected', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiSkuReconcile(v)}
    />
  );
}
