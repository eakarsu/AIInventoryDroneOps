import React from 'react';
import CrudPage from '../components/CrudPage';
import { discrepanciesApi } from '../services/api';

const FIELDS = [
  { key: 'mission_id_ref', label: 'Mission', type: 'text' },
  { key: 'sku', label: 'SKU', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'delta', label: 'Δ', type: 'number' },
  { key: 'severity', label: 'Severity', type: 'select', options: ["low","medium","high","critical"] },
  { key: 'status', label: 'Status', type: 'select', options: ["open","recount","resolved"] }
];

export default function DiscrepanciesPage() {
  return (
    <CrudPage
      title="Discrepancies"
      subtitle="Manage discrepancies records"
      api={discrepanciesApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
