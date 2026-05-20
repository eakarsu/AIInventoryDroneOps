import React from 'react';
import AIPage from '../components/AIPage';
import { aiSwarmCoordinator } from '../services/api';

export default function AISwarmCoordinatorPage() {
  return (
    <AIPage
      title="AI · Swarm Coordinator"
      feature="swarm-coordinator"
      subtitle="Swarm Coordinator"
      inputs={[
        { key: 'mission_objective', label: 'Objective', type: 'textarea', placeholder: '' },
        { key: 'drones_available', label: 'Drones', type: 'number', placeholder: '' },
        { key: 'zone', label: 'Zone', type: 'text', placeholder: '' }
      ]}
      run={(v) => aiSwarmCoordinator(v)}
    />
  );
}
