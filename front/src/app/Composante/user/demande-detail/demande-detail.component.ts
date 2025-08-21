import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';
import { FormsModule } from '@angular/forms';

// --- Corrected Interfaces ---
// La propriété "validations" est maintenant directement sur l'interface Demande,
// car c'est ainsi que le backend la renvoie.
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
}

interface DemandeValidation {
  id: number;
  demande_id: number;
  user_id: number;
  statut: 'en attente' | 'approuvé' | 'rejeté' | 'validé' | 'initial';
  ordre: number;
  date_validation?: string;
  commentaire?: string;
  user?: { username: string, signature_image_url?: string } | null; // ✅ Ajout signature
}


interface Journal {
  id: number;
  nom_journal: string;
  nom_projet: string;
  // Les validations ne sont plus ici, car elles sont sur l'objet demande principal
}

interface Demande {
  id: number;
  userId: number;
  type: 'DED' | 'Recette';
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
  validations?: DemandeValidation[]; // ✅ Corrected: The validations array is here now
}

@Component({
  selector: 'app-demande-detail',
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule
  ],
  providers: [
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

  // Le type a été mis à jour pour correspondre à la nouvelle interface
  displayValidators: DemandeValidation[] = []; 

  showDeleteConfirmModal: boolean = false;
  showRejectModal: boolean = false;
  rejectReason: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeService
  ) { }
  
  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.demandeId = +idFromRoute;
      this.loadDemandeDetails(this.demandeId);
    } else {
      console.error('ID de demande manquant. Redirection vers la liste des demandes.');
      this.router.navigate(['/demandes']);
    }
  }
handleImageError(validator: DemandeValidation) {
  // Si l'image ne charge pas, on peut mettre undefined pour ne plus essayer de la charger
  if (validator.user) {
    validator.user.signature_image_url = undefined;
  }
}

  loadDemandeDetails(id: number): void {
    this.demandeService.getDemandeById(id).subscribe({
      next: (data: Demande) => {
        this.demande = data;
        this.errorMessage = '';

        // ✅ IMPORTANT: Correction de la ligne suivante pour accéder directement à `demande.validations`
        const allValidations = this.demande.validations?.sort((a, b) => a.ordre - b.ordre) || [];

        this.displayValidators = [];
        const maxValidators = 4;
        
        for (let i = 0; i < maxValidators; i++) {
          if (allValidations[i]) {
            this.displayValidators.push(allValidations[i]);
          } else {
            // Création d'un objet "placeholder" pour les validateurs manquants.
            this.displayValidators.push({
              id: 0,
              demande_id: 0,
              user_id: 0,
              statut: 'initial', // Utilisation de 'initial' pour un statut non encore existant
              ordre: i,
              user: null
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
          setTimeout(() => {
            this.router.navigate(['/demandes']);
          }, 1500);
        },
        error: (err: any) => {
          console.error("Erreur lors de la suppression de la demande:", err);
          this.errorMessage = 'Erreur lors de la suppression de la demande. Vous n\'avez peut-être pas les permissions.';
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
