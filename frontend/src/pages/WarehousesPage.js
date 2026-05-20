import React from 'react';
import CrudPage from '../components/CrudPage';
import { warehousesApi } from '../services/api';

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'sqft', label: 'Square Feet', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ["active","maintenance","offline"] }
];

export default function WarehousesPage() {
  return (
    <CrudPage
      title="Warehouses"
      subtitle="Manage warehouses records"
      api={warehousesApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
