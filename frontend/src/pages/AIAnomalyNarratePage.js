import React from 'react';
import AIPage from '../components/AIPage';
import { aiAnomalyNarrate } from '../services/api';

export default function AIAnomalyNarratePage() {
  return (
    <AIPage
      title="AI · Anomaly Narrator"
      feature="anomaly-narrate"
      subtitle="Turn an anomaly into a readable narrative for ops / exec / engineering."
      inputs={[
        { key: 'anomaly_summary', label: 'Anomaly Summary', type: 'textarea', placeholder: 'Zone B shrinkage 0.4% -> 4.1% week-over-week' },
        { key: 'context_hint', label: 'Context', type: 'text', placeholder: 'Reno DC zone B' },
        { key: 'audience', label: 'Audience', type: 'select', options: ['ops', 'exec', 'engineering'], defaultValue: 'ops' }
      ]}
      run={(v) => aiAnomalyNarrate(v)}
    />
  );
}
