export interface Validation {
  id: number;
  user_id: number;
  ordre: number;
  statut: string;
  commentaire?: string;
  date_validation?: string;
  user?: { id: number; username: string; role?: string };
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
  details?: any[];        // si tu as un type pour les détails
  journal?: any;
  validations?: Validation[]; // ✅ c’est cette ligne qui est essentielle
}
