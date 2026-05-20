import React from 'react';
import CrudPage from '../components/CrudPage';
import { zonesApi } from '../services/api';

const FIELDS = [
  { key: 'warehouse_name', label: 'Warehouse', type: 'text' },
  { key: 'name', label: 'Zone', type: 'text' },
  { key: 'aisle_count', label: 'Aisles', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ["active","maintenance","offline"] }
];

export default function ZonesPage() {
  return (
    <CrudPage
      title="Zones"
      subtitle="Manage zones records"
      api={zonesApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
