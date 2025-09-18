import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandeService } from '../../../services/demande.service';
import { NumbersToWordsService } from '../../../services/numbers-to-words.service';

interface Personne {
  id: number;
  nom: string;
  prenom: string;
  poste?: string;
}

interface Budget {
  id: number;
  code_budget: string;
  description: string;
  annee_fiscale?: number;
  budget_annuel?: number;
  budget_trimestre_1?: number;
  budget_trimestre_2?: number;
  budget_trimestre_3?: number;
  budget_trimestre_4?: number;
}

interface DemandeDetail {
  id: number;
  demande_id: number;
  nature: string;
  libelle: string;
  beneficiaire: string;
  amount: number;
  nif_exists: 'oui' | 'non';
  numero_compte: string | null;
  budget_id: number | null;
  status_detail: 'en attente' | 'approuvée' | 'rejetée';
  nif?: string;
  stat?: string;
  budget?: Budget;
}

// MISE À JOUR : Ajout de la propriété signatureFinale
interface DemandeValidation {
  id: number;
  demande_id: number;
  user_id: number;
  statut: 'en attente' | 'approuvé' | 'rejeté' | 'validé' | 'initial';
  ordre: number;
  date_validation?: string;
  commentaire?: string;
  user?: { username: string, signature_image_url?: string } | null;
  signature_validation_url?: string;
  signatureFinale?: string | null; // MODIFICATION
}

interface Journal {
  id: number;
  nom_journal: string;
  nom_projet: string;
  solde: number;
}

interface Demande {
  id: number;
  userId: number;
  type: 'DED' | 'Recette' | 'ERD';
  journal_id: number | null;
  date: string;
  expected_justification_date: string | null;
  pj_status: 'oui' | 'pas encore';
  resp_pj_id: number | null;
  status: 'en attente' | 'approuvée' | 'rejetée';
  montant_total: number;
  description: string;
  details?: DemandeDetail[];
  user?: { username: string };
  comments?: any[];
  journal?: Journal;
  validations?: DemandeValidation[];
  responsible_pj?: Personne;
}

@Component({
  selector: 'app-demande-detail',
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe
  ]
})
export class DemandeDetailComponent implements OnInit {
  demandeId: number | null = null;
  demande: Demande | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  finalValidatorName: string | null = null;
  serverUrl = 'http://localhost:8081';

  // Propriétés pour les totaux
  totalDebit: number = 0;
  totalCredit: number = 0;
  solde: number = 0;

  displayValidators: DemandeValidation[] = []; 

  showDeleteConfirmModal: boolean = false;
  showRejectModal: boolean = false;
  rejectReason: string = '';
  montantEnLettres: string = '';

  // Propriétés pour la popup
  showTooltip: boolean = false;
  selectedDetail: DemandeDetail | null = null;

  // Role de l'utilisateur
  currentUserRole: string = ''; // RH, DAF ou UTILISATEUR

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeService,
    private numbersToWordsService: NumbersToWordsService
  ) { }

  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.demandeId = +idFromRoute;
      this.loadDemandeDetails(this.demandeId);

      // Récupérer le rôle utilisateur
      this.demandeService.getCurrentUserRole().subscribe(role => {
        this.currentUserRole = role;
      });

    } else {
      console.error('ID de demande manquant. Redirection vers la liste des demandes.');
      this.router.navigate(['/demandes']);
    }
  }

  // Vérifie si l'utilisateur peut voir les colonnes Budget
  canViewBudget(): boolean {
    return this.currentUserRole === 'rh' || this.currentUserRole === 'daf';
  }

  // Méthode pour afficher la popup au survol
  showBudgetTooltip(detail: DemandeDetail): void {
    this.selectedDetail = detail;
    this.showTooltip = true;
  }

  // Méthode pour masquer la popup
  hideBudgetTooltip(): void {
    this.showTooltip = false;
    this.selectedDetail = null;
  }

  // Calcul des totaux
  calculateTotals(): void {
    this.totalDebit = 0;
    this.totalCredit = 0;

    if (this.demande && this.demande.details) {
      if (this.demande.type === 'DED' || this.demande.type === 'Recette') {
        this.demande.details.forEach(detail => {
          const montant = typeof detail.amount === 'string' ? parseFloat(detail.amount) : detail.amount;
          this.totalDebit += montant;
        });
      } else if (this.demande.type === 'ERD') {
        this.demande.details.forEach((detail, index) => {
          const montant = typeof detail.amount === 'string' ? parseFloat(detail.amount) : detail.amount;
          if (index === 0) this.totalCredit += montant;
          else this.totalDebit += montant;
        });
      }
      this.solde = this.totalDebit - this.totalCredit;
    }
  }

  handleImageError(validator: DemandeValidation) {
    if (validator.user) {
      validator.user.signature_image_url = undefined;
    }
  }

  loadDemandeDetails(id: number): void {
    this.demandeService.getDemandeById(id).subscribe({
      next: (data: Demande) => {
        this.demande = data;

        // Conversion des montants en nombres
        if (typeof this.demande.montant_total === 'string') {
          this.demande.montant_total = parseFloat(this.demande.montant_total);
        }
        if (this.demande.details) {
          this.demande.details.forEach(detail => {
            if (typeof detail.amount === 'string') detail.amount = parseFloat(detail.amount);
          });
        }

        // Calcul des totaux
        this.calculateTotals();

        // Montant en lettres
        if (this.demande.montant_total !== undefined) {
          this.montantEnLettres = this.numbersToWordsService.convertNumberToWords(this.demande.montant_total);
        }

        // MISE À JOUR : Gestion des validateurs pour utiliser la signature statique
        const allValidations = this.demande.validations?.sort((a, b) => a.ordre - b.ordre) || [];
        this.displayValidators = [];
        const maxValidators = 4;
        for (let i = 0; i < maxValidators; i++) {
          if (allValidations[i]) {
            const validation = allValidations[i];
            const finalSignature = validation.signature_validation_url || validation.user?.signature_image_url;

            this.displayValidators.push({
              ...validation,
              signatureFinale: finalSignature
            });
          } else {
            this.displayValidators.push({
              id: -i - 1,
              demande_id: 0,
              user_id: 0,
              statut: 'initial',
              ordre: i,
              user: null,
              signatureFinale: null
            });
          }
        }
        const finalValidation = allValidations.find(v => v.statut === 'approuvé' || v.statut === 'rejeté' || v.statut === 'validé');
        this.finalValidatorName = finalValidation?.user?.username || null;
      },
      error: (err: any) => {
        console.error("Erreur lors du chargement des détails de la demande:", err);
        this.errorMessage = 'Impossible de charger les détails de la demande.';
        this.demande = null;
      }
    });
  }

  getBudgetTrimestre(detail: DemandeDetail, demandeDate: string) {
    if (!detail?.budget || !demandeDate) return null;
    const mois = new Date(demandeDate).getMonth() + 1;
    if (mois >= 1 && mois <= 3) return detail.budget.budget_trimestre_1;
    if (mois >= 4 && mois <= 6) return detail.budget.budget_trimestre_2;
    if (mois >= 7 && mois <= 9) return detail.budget.budget_trimestre_3;
    if (mois >= 10 && mois <= 12) return detail.budget.budget_trimestre_4;
    return null;
  }

  editDemande(): void {
    this.router.navigate(['/demandes/edit', this.demandeId]);
  }

  openDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
  }

  confirmDelete(): void {
    this.showDeleteConfirmModal = false;
    if (this.demandeId) {
      this.demandeService.deleteDemande(this.demandeId).subscribe({
        next: () => {
          this.successMessage = 'Demande supprimée avec succès !';
          setTimeout(() => this.router.navigate(['/demandes']), 1500);
        },
        error: (err: any) => {
          console.error("Erreur lors de la suppression de la demande:", err);
          this.errorMessage = 'Erreur lors de la suppression de la demande. Vérifiez vos permissions.';
        }
      });
    }
  }

  approveDemande(): void {
  if (this.demandeId) {
    this.demandeService.updateDemandeStatus(this.demandeId, { status: 'approuvée' }).subscribe({
      next: () => {
        this.successMessage = 'Demande approuvée avec succès !';
        this.loadDemandeDetails(this.demandeId!);
      },
      error: (err: any) => {
        console.error("Erreur lors de l'approbation de la demande:", err);
        this.errorMessage = 'Erreur lors de l\'approbation de la demande. Vérifiez vos permissions.';
      }
    });
  }
}


  openRejectModal(): void {
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (!this.rejectReason.trim()) {
      this.errorMessage = 'La raison du rejet ne peut pas être vide.';
      return;
    }
    this.showRejectModal = false;
    if (this.demandeId) {
      this.demandeService.updateDemandeStatus(this.demandeId, { status: 'rejetée', comments: this.rejectReason }).subscribe({
        next: () => {
          this.successMessage = 'Demande rejetée avec succès !';
          this.loadDemandeDetails(this.demandeId!);
        },
        error: (err: any) => {
          console.error("Erreur lors du rejet de la demande:", err);
          this.errorMessage = 'Erreur lors du rejet de la demande. Vérifiez vos permissions.';
        }
      });
    }
  }
}