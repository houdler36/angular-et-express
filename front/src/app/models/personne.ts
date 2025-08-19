// src/app/models/personne.ts
export interface Personne {
  id?: number;
  nom: string;
  prenom: string; // ajouté
  poste?: string;
}
