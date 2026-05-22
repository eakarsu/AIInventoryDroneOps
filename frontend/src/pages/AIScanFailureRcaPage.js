import React from 'react';
import AIPage from '../components/AIPage';
import { aiScanFailureRca } from '../services/api';

export default function AIScanFailureRcaPage() {
  return (
    <AIPage
      title="AI · Scan-Failure RCA"
      feature="scan-failure-rca"
      subtitle="Root-cause analysis across scan_results / telemetry / maintenance."
      inputs={[
        { key: 'failure_summary', label: 'Failure Summary', type: 'textarea', placeholder: 'DR-003 failed 22 of 80 scans in aisle B-2' },
        { key: 'telemetry_snippet', label: 'Telemetry Snippet', type: 'textarea', placeholder: 'battery_pct 92 -> 41 in 18 min, motor_temp 78C' },
        { key: 'maintenance_snippet', label: 'Maintenance Snippet', type: 'textarea', placeholder: 'Last battery swap 412 hrs ago' }
      ]}
      run={(v) => aiScanFailureRca(v)}
    />
  );
}
