import { useMemo } from 'react';
import { useModuleStore } from '../../domain/stores/moduleStore'; // Assuming Zustand store
import { toLegacyModule } from '../../infrastructure/mappers/toLegacyModule';

export const useLegacyFormData = () => {
  // Subscribe to Zustand stores
  const modules = useModuleStore((state) => state.modules);

  // Memoized transformation to flat array structure
  const formData = useMemo(() => {
    return {
      modules: modules.map(toLegacyModule), // Transform rich domain models to plain legacy objects
    };
  }, [modules]);

  return formData;
};
