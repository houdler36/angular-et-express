import React, { useEffect } from 'react';
import { withLegacyBridge, LegacyFormData } from './LegacyBridge';

interface TestComponentProps {
  formData: LegacyFormData;
}

const TestComponent: React.FC<TestComponentProps> = ({ formData }) => {
  useEffect(() => {
    console.log('Legacy formData:', formData);
  }, [formData]);

  return (
    <div>
      <h1>Test Component</h1>
      <p>Check console for formData</p>
    </div>
  );
};

export const TestComponentWithLegacy = withLegacyBridge(TestComponent);
