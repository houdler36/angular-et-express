import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';
import { FormsModule } from '@angular/forms';

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

interface JournalValider {
  id: number;
  journal_id: number;
  user_id: number;
  statut: 'en attente' | 'approuvé' | 'rejeté';
  ordre: number;
  date_validation?: string;
  commentaire?: string;
  user?: { username: string }; // Ajout de la propriété user
}

interface Journal {
  id: number;
  nom_journal: string;
  nom_projet: string;
  validations?: JournalValider[];
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
  journal?: Journal; // Propriété ajoutée
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
    DatePipe
  ]
})
export class DemandeDetailComponent implements OnInit {
  demandeId: number | null = null;
  demande: Demande | null = null;
  errorMessage: string = '';
  successMessage: string = '';

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

  loadDemandeDetails(id: number): void {
    this.demandeService.getDemandeById(id).subscribe({
      next: (data: Demande) => {
        this.demande = data;
        this.errorMessage = '';
      },
      error: (err: any) => {
        console.error("Erreur lors du chargement des détails de la demande:", err);
        this.errorMessage = 'Impossible de charger les détails de la demande. Vous n\'avez peut-être pas les permissions ou la demande n\'existe pas.';
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