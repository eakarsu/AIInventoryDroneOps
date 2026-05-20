import React from 'react';
import AIPage from '../components/AIPage';
import { aiAnomalyClassify } from '../services/api';

export default function AIAnomalyClassifyPage() {
  return (
    <AIPage
      title="AI · Anomaly Classifier"
      feature="anomaly-classify"
      subtitle="Anomaly Classifier"
      inputs={[
        { key: 'observation', label: 'Observation', type: 'textarea', placeholder: '' },
        { key: 'context_hint', label: 'Context', type: 'text', placeholder: '' }
      ]}
      run={(v) => aiAnomalyClassify(v)}
    />
  );
}
