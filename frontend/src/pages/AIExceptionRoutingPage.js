import React from 'react';
import AIPage from '../components/AIPage';
import { aiExceptionRouting } from '../services/api';

export default function AIExceptionRoutingPage() {
  return (
    <AIPage
      title="AI · Exception Routing"
      feature="exception-routing"
      subtitle="Exception Routing"
      inputs={[
        { key: 'exception_summary', label: 'Summary', type: 'textarea', placeholder: '' },
        { key: 'urgency', label: 'Urgency', type: 'select', placeholder: '', options: ["routine","urgent","critical"] }
      ]}
      run={(v) => aiExceptionRouting(v)}
    />
  );
}
