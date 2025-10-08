import React from 'react';
import { useLegacyFormData } from './useLegacyFormData';

export interface LegacyFormData {
  modules: any[]; // Define properly based on legacy structure
}

export const withLegacyBridge = <P extends object>(
  WrappedComponent: React.ComponentType<P & { formData: LegacyFormData }>
) => {
  return (props: P) => {
    const formData = useLegacyFormData();

    return <WrappedComponent {...props} formData={formData} />;
  };
};
