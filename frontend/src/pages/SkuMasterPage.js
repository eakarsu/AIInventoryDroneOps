import React from 'react';
import CrudPage from '../components/CrudPage';
import { sku_masterApi } from '../services/api';

const FIELDS = [
  { key: 'sku', label: 'SKU', type: 'text' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'expected_qty', label: 'Expected Qty', type: 'number' },
  { key: 'unit_cost', label: 'Unit Cost', type: 'number' }
];

export default function SkuMasterPage() {
  return (
    <CrudPage
      title="SKU Master"
      subtitle="Manage sku master records"
      api={sku_masterApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
