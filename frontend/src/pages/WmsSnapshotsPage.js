import React from 'react';
import CrudPage from '../components/CrudPage';
import { wms_snapshotsApi } from '../services/api';

const FIELDS = [
  { key: 'warehouse_name', label: 'Warehouse', type: 'text' },
  { key: 'snapshot_at', label: 'When', type: 'datetime-local' },
  { key: 'total_skus', label: 'Total SKUs', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'text' }
];

export default function WmsSnapshotsPage() {
  return (
    <CrudPage
      title="WMS Snapshots"
      subtitle="Manage wms snapshots records"
      api={wms_snapshotsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
