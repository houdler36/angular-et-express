import { Module } from '../../domain/models/Module'; // Assuming domain model

export interface LegacyModule {
  id: string;
  name: string;
  description: string;
  // Add other legacy fields
}

export const toLegacyModule = (module: Module): LegacyModule => {
  return {
    id: module.id,
    name: module.name,
    description: module.description,
    // Map other fields as needed
  };
};
