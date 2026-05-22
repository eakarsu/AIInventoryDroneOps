import React from 'react';
import CrudPage from '../components/CrudPage';
import { scan_schedulesApi } from '../services/api';

const FIELDS = [
  { key: 'name', label: 'Schedule Name', type: 'text' },
  { key: 'warehouse_name', label: 'Warehouse', type: 'text' },
  { key: 'cron_expr', label: 'Cron Expression', type: 'text' },
  { key: 'zone', label: 'Zone', type: 'text' },
  { key: 'sku_priority', label: 'SKU Priority', type: 'select', options: ['cycle-count', 'high-velocity', 'exception-only'] },
  { key: 'drone_count', label: 'Drones', type: 'number' },
  { key: 'active', label: 'Active', type: 'select', options: ['true', 'false'] },
  { key: 'notes', label: 'Notes', type: 'text' },
];

export default function ScanSchedulesPage() {
  return (
    <CrudPage
      title="Scan Schedules"
      subtitle="Recurring cycle-count plans (cron-driven)."
      api={scan_schedulesApi}
      fields={FIELDS}
      statusKey="active"
    />
  );
}
