export interface Demande {
  id?: number; // Clé primaire, optionnel lors de la création
  userId: number; // ID de l'utilisateur
  type: 'DED' | 'Recette'; // Type de la demande
  journalId?: number; // ID du journal, optionnel
  date: string; // Date de la demande (format ISO string)
  expectedJustificationDate?: string; // Date attendue pour la justification, optionnel
  pjStatus: 'oui' | 'pas encore'; // Statut de la pièce jointe
  respPjId?: number; // ID du responsable de la pièce jointe, optionnel
  status: 'en attente' | 'approuvée' | 'rejetée' | string; // Statut de la demande
  montant_total?: number; // Montant total, optionnel pour la soumission
  description?: string; // Description de la demande, optionnel
}
