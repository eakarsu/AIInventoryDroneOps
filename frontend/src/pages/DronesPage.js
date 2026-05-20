import React from 'react';
import CrudPage from '../components/CrudPage';
import { dronesApi } from '../services/api';

const FIELDS = [
  { key: 'serial', label: 'Serial', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ["ready","flying","charging","maintenance","offline"] },
  { key: 'flight_hours', label: 'Flight Hours', type: 'number' },
  { key: 'battery_cycles', label: 'Battery Cycles', type: 'number' }
];

export default function DronesPage() {
  return (
    <CrudPage
      title="Drones"
      subtitle="Manage drones records"
      api={dronesApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
