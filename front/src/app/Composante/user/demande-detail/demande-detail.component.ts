import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';
import { Demande } from '../../../models/demande';
import { FormsModule } from '@angular/forms'; // <--- ASSUREZ-VOUS QUE CECI EST BIEN IMPORTÉ

@Component({
  selector: 'app-demande-detail',
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, CurrencyPipe, DatePipe, FormsModule] // <--- ET AJOUTÉ ICI
})
export class DemandeDetailComponent implements OnInit {
  demandeId: string | null = null;
  demande: any = null;
  errorMessage: string = '';
  successMessage: string = ''; // <--- AJOUTÉ

  // Variables pour la modale de suppression
  showDeleteConfirmModal: boolean = false; // <--- AJOUTÉ

  // Variables pour la modale de rejet
  showRejectModal: boolean = false; // <--- AJOUTÉ
  rejectReason: string = ''; // <--- AJOUTÉ

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeService
  ) { }

  ngOnInit(): void {
    this.demandeId = this.route.snapshot.paramMap.get('id');
    if (this.demandeId) {
      this.loadDemandeDetails(this.demandeId);
    } else {
      console.error('ID de demande manquant. Redirection vers la liste des demandes.');
      this.router.navigate(['/demandes']);
    }
  }

  loadDemandeDetails(id: string): void {
    console.log(`Chargement des détails de la demande avec l'ID: ${id} depuis le backend.`);
    this.demandeService.getDemandeById(id).subscribe({
      next: (data) => {
        this.demande = data;
        console.log("Détails de la demande chargés:", this.demande);
        this.errorMessage = '';
      },
      error: (err) => {
        console.error("Erreur lors du chargement des détails de la demande:", err);
        this.errorMessage = 'Impossible de charger les détails de la demande. Vous n\'avez peut-être pas les permissions ou la demande n\'existe pas.';
        this.demande = null;
      }
    });
  }

  editDemande(): void {
    this.router.navigate(['/demandes/edit', this.demandeId]);
  }

  // Ouvre la modale de confirmation de suppression
  openDeleteConfirmModal(): void { // <--- AJOUTÉ
    this.showDeleteConfirmModal = true;
  }

  // Annule la suppression
  cancelDelete(): void { // <--- AJOUTÉ
    this.showDeleteConfirmModal = false;
  }

  // Confirme et exécute la suppression
  confirmDelete(): void { // <--- AJOUTÉ
    this.showDeleteConfirmModal = false; // Ferme la modale
    if (this.demandeId) {
      this.demandeService.deleteDemande(this.demandeId).subscribe({
        next: () => {
          this.successMessage = 'Demande supprimée avec succès !';
          console.log('Demande supprimée avec succès !');
          setTimeout(() => {
            this.router.navigate(['/demandes']); // Rediriger après un court délai
          }, 1500); // Délai pour que le message de succès soit visible
        },
        error: (err) => {
          console.error("Erreur lors de la suppression de la demande:", err);
          this.errorMessage = 'Erreur lors de la suppression de la demande. Vous n\'avez peut-être pas les permissions.';
        }
      });
    }
  }

  approveDemande(): void {
    if (this.demandeId) {
      this.demandeService.updateDemandeStatus(this.demandeId, { status: 'Approved' }).subscribe({
        next: () => {
          this.successMessage = 'Demande approuvée avec succès !';
          console.log(`Demande ${this.demandeId} approuvée.`);
          this.loadDemandeDetails(this.demandeId!); // Recharger les détails pour mettre à jour l'UI
        },
        error: (err) => {
          console.error("Erreur lors de l'approbation de la demande:", err);
          this.errorMessage = 'Erreur lors de l\'approbation de la demande. Vérifiez vos permissions.';
        }
      });
    }
  }

  // Ouvre la modale de rejet
  openRejectModal(): void { // <--- AJOUTÉ
    this.showRejectModal = true;
    this.rejectReason = ''; // Réinitialise la raison de rejet
  }

  // Annule le rejet
  cancelReject(): void { // <--- AJOUTÉ
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  // Confirme et exécute le rejet
  confirmReject(): void { // <--- AJOUTÉ
    if (!this.rejectReason.trim()) {
      this.errorMessage = 'La raison du rejet ne peut pas être vide.';
      return;
    }
    this.showRejectModal = false; // Ferme la modale

    if (this.demandeId) {
      this.demandeService.updateDemandeStatus(this.demandeId, { status: 'Rejected', comments: this.rejectReason }).subscribe({
        next: () => {
          this.successMessage = 'Demande rejetée avec succès !';
          console.log(`Demande ${this.demandeId} rejetée pour la raison: ${this.rejectReason}`);
          this.loadDemandeDetails(this.demandeId!); // Recharger les détails pour mettre à jour l'UI
        },
        error: (err) => {
          console.error("Erreur lors du rejet de la demande:", err);
          this.errorMessage = 'Erreur lors du rejet de la demande. Vérifiez vos permissions.';
        }
      });
    }
  }
}
