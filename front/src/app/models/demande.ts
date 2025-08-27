export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Validation {
  id: number;
  user_id: number;
  ordre: number;
  statut: 'initial' | 'en attente' | 'validé' | 'rejeté' | 'annulé';
  commentaire?: string;
  signature?: string;
  date_validation?: string;
  user?: User;
}

export interface DemandeDetail {
  id: number;
  libelle: string;
  amount: number;
  budget_id?: string;
  numero_compte?: string;
  beneficiaire?: string;
  status_detail?: string;
}

export interface Demande {
  id?: number;
  userId: number;
  type: 'DED' | 'Recette';
  journalId?: number;
  date: string;
  expectedJustificationDate?: string;
  pjStatus: 'oui' | 'pas encore';
  respPjId?: number;
  status: 'en attente' | 'approuvée' | 'rejetée' | string;
  montant_total?: number;
  description?: string;
  responsible_pj: { prenom: string; nom: string; };

  // ✅ Ajout des nouvelles propriétés
  details?: DemandeDetail[];
  validations?: Validation[];
  journal?: any; // ou interface spécifique si tu as un Journal
}
