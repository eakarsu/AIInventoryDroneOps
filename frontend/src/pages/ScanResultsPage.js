import React from 'react';
import CrudPage from '../components/CrudPage';
import { scan_resultsApi } from '../services/api';

const FIELDS = [
  { key: 'mission_id_ref', label: 'Mission', type: 'text' },
  { key: 'sku', label: 'SKU', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'quantity', label: 'Qty', type: 'number' },
  { key: 'scanned_at', label: 'Scanned', type: 'datetime-local' }
];

export default function ScanResultsPage() {
  return (
    <CrudPage
      title="Scan Results"
      subtitle="Manage scan results records"
      api={scan_resultsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
