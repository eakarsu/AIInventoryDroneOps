import React from 'react';
import CrudPage from '../components/CrudPage';
import { missionsApi } from '../services/api';

const FIELDS = [
  { key: 'warehouse_name', label: 'Warehouse', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ["scheduled","running","complete","aborted"] },
  { key: 'scheduled_at', label: 'Scheduled', type: 'datetime-local' },
  { key: 'drone_count', label: 'Drones', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' }
];

export default function MissionsPage() {
  return (
    <CrudPage
      title="Missions"
      subtitle="Manage missions records"
      api={missionsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
