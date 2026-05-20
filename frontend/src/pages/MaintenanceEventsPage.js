import React from 'react';
import CrudPage from '../components/CrudPage';
import { maintenance_eventsApi } from '../services/api';

const FIELDS = [
  { key: 'drone_serial', label: 'Drone', type: 'text' },
  { key: 'event_type', label: 'Event Type', type: 'text' },
  { key: 'performed_at', label: 'Performed', type: 'datetime-local' },
  { key: 'technician', label: 'Technician', type: 'text' }
];

export default function MaintenanceEventsPage() {
  return (
    <CrudPage
      title="Maintenance Events"
      subtitle="Manage maintenance events records"
      api={maintenance_eventsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
