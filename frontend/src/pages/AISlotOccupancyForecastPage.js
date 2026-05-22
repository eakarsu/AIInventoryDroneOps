import React from 'react';
import AIPage from '../components/AIPage';
import { aiSlotOccupancyForecast } from '../services/api';

export default function AISlotOccupancyForecastPage() {
  return (
    <AIPage
      title="AI · Slot-Occupancy Forecaster"
      feature="slot-occupancy-forecast"
      subtitle="Per-slot occupancy projection over a horizon."
      inputs={[
        { key: 'slot_history_text', label: 'Slot History', type: 'textarea', placeholder: 'A-1-1 70%\nA-1-2 82%' },
        { key: 'horizon_days', label: 'Horizon (days)', type: 'number', defaultValue: 14 }
      ]}
      run={(v) => aiSlotOccupancyForecast(v)}
    />
  );
}
