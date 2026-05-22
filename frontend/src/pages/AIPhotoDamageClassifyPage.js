import React from 'react';
import AIPage from '../components/AIPage';
import { aiPhotoDamageClassify } from '../services/api';

export default function AIPhotoDamageClassifyPage() {
  return (
    <AIPage
      title="AI · Photo Damage Classifier"
      feature="photo-damage-classify"
      subtitle="Classify damage in drone-captured pallet/box photos via description."
      inputs={[
        { key: 'photo_description', label: 'Photo Description', type: 'textarea', placeholder: 'Pallet corner crushed, plastic wrap torn, contents leaning.' },
        { key: 'sku', label: 'SKU', type: 'text', placeholder: 'SKU-A-001' },
        { key: 'location', label: 'Location', type: 'text', placeholder: 'A-1-3' }
      ]}
      run={(v) => aiPhotoDamageClassify(v)}
    />
  );
}
