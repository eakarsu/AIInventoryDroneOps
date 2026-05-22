import React from 'react';
import AIPage from '../components/AIPage';
import { aiMisPickDetect } from '../services/api';

export default function AIMisPickDetectPage() {
  return (
    <AIPage
      title="AI · Mis-pick Detection"
      feature="mis-pick-detect"
      subtitle="Find slots where the scanned SKU does not match the pick list."
      inputs={[
        { key: 'scan_results_text', label: 'Scan Results', type: 'textarea', placeholder: 'A-1-3 expected SKU-A-001 observed SKU-A-002 qty 142' },
        { key: 'pick_list_text', label: 'Pick List', type: 'textarea', placeholder: 'A-1-3 SKU-A-001 142' }
      ]}
      run={(v) => aiMisPickDetect(v)}
    />
  );
}
