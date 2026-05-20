import React from 'react';
import CrudPage from '../components/CrudPage';
import { telemetryApi } from '../services/api';

const FIELDS = [
  { key: 'drone_serial', label: 'Drone', type: 'text' },
  { key: 'recorded_at', label: 'When', type: 'datetime-local' },
  { key: 'motor_temp', label: 'Motor Temp', type: 'number' },
  { key: 'battery_pct', label: 'Battery %', type: 'number' }
];

export default function TelemetryPage() {
  return (
    <CrudPage
      title="Telemetry"
      subtitle="Manage telemetry records"
      api={telemetryApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
