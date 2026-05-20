import React from 'react';
import CrudPage from '../components/CrudPage';
import { work_ordersApi } from '../services/api';

const FIELDS = [
  { key: 'drone_serial', label: 'Drone', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ["battery_swap","prop_replace","calibration","firmware","inspection"] },
  { key: 'status', label: 'Status', type: 'select', options: ["scheduled","in_progress","complete","blocked"] },
  { key: 'scheduled_for', label: 'Scheduled', type: 'datetime-local' }
];

export default function WorkOrdersPage() {
  return (
    <CrudPage
      title="Work Orders"
      subtitle="Manage work orders records"
      api={work_ordersApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
