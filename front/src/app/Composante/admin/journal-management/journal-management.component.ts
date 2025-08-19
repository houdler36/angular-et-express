import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalApiService } from '../../../services/journal-api.service';
import { HttpErrorResponse } from '@angular/common/http'; // Import pour gérer les erreurs HTTP

@Component({
  selector: 'app-journal-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-management.component.html',
  styleUrls: ['./journal-management.component.css']
})
export class JournalManagementComponent implements OnInit {

  // Propriétés existantes
  newJournal = {
    nom_journal: '',
    nom_projet: '',
  };
  budgetsDisponibles: any[] = [];
  selectedBudgetIds: number[] = [];
  valideursDisponibles: any[] = []; // Cette liste contiendra uniquement les utilisateurs RH
  selectedValideurs: { user_id: number, ordre: number }[] = [];
  journals: any[] = [];

  // ------------------------------------
  // Nouvelles propriétés pour le mode d'édition
  // ------------------------------------
  isEditMode = false;
  editingJournalId: number | null = null;
  
  // ------------------------------------
  // Propriétés pour le pop-up
  // ------------------------------------
  isModalVisible = false;
  modalTitle = '';
  modalMessage = '';
  isSuccess = false;

  constructor(private journalApiService: JournalApiService) {}

  ngOnInit() {
    this.loadBudgets();
    this.loadValideurs();
    this.loadJournals();
  }

  getValideurName(userId: number): string {
  return this.valideursDisponibles?.find(v => v.id === userId)?.username || 'Inconnu';
}
  loadBudgets() {
    this.journalApiService.getAllBudgets().subscribe({
      next: (data) => {
        const year = new Date().getFullYear();
        this.budgetsDisponibles = data.filter(b => b.annee_fiscale === year);
      },
      error: (e) => console.error(e)
    });
  }

  // MODIFIÉ : Retourne à l'ancienne méthode qui charge uniquement les utilisateurs RH
  loadValideurs() {
    this.journalApiService.getAllRhUsers().subscribe({ 
      next: (data) => {
        this.valideursDisponibles = data;
      },
      error: (e) => console.error(e)
    });
  }

  loadJournals() {
    this.journalApiService.getAllJournals().subscribe({
      next: (data) => {
        // Triez les validateurs de chaque journal par ordre
        this.journals = data.map((journal: any) => {
          if (journal.valideurs && journal.valideurs.length > 0) {
            journal.valideurs.sort((a: any, b: any) => a.ordre - b.ordre);
          }
          return journal;
        });
      },
      error: (e) => console.error(e)
    });
  }

  isValideurSelected(id: number): boolean {
    return this.selectedValideurs.some(v => v.user_id === id);
  }

  // MODIFIÉ : La logique de validation a été retirée car la liste ne contient plus que des utilisateurs RH
  toggleValideur(valideur: any, event: MouseEvent) {
    event.preventDefault(); // Empêche la sélection native

    const index = this.selectedValideurs.findIndex(v => v.user_id === valideur.id);

    if (index >= 0) {
      // Retirer le valideur et mettre à jour l'ordre
      this.selectedValideurs.splice(index, 1);
      this.selectedValideurs.forEach((v, i) => v.ordre = i + 1);
    } else {
      // Ajouter à la fin avec ordre
      this.selectedValideurs.push({
        user_id: valideur.id,
        ordre: this.selectedValideurs.length + 1
      });
    }
  }

  // ------------------------------------
  // Fonctions de gestion du pop-up
  // ------------------------------------
  showModal(message: string, isSuccess: boolean) {
    this.isSuccess = isSuccess;
    this.modalTitle = isSuccess ? 'Succès !' : 'Erreur !';
    this.modalMessage = message;
    this.isModalVisible = true;
  }

  hideModal() {
    this.isModalVisible = false;
  }

  // ------------------------------------
  // Fonctions de création, mise à jour et suppression
  // ------------------------------------
  addJournal() {
    if (this.selectedBudgetIds.length === 0) {
      this.showModal('Veuillez sélectionner au moins un budget.', false);
      return;
    }
    if (this.selectedValideurs.length === 0) {
      this.showModal('Veuillez sélectionner au moins un valideur.', false);
      return;
    }

    const data = {
      nom_journal: this.newJournal.nom_journal,
      nom_projet: this.newJournal.nom_projet,
      budgetIds: this.selectedBudgetIds,
      valideurs: this.selectedValideurs
    };

    this.journalApiService.createJournal(data).subscribe({
      next: () => {
        this.showModal('Journal créé avec succès !', true);
        this.loadJournals();
        this.resetForm();
      },
      error: (e: HttpErrorResponse) => {
        console.error('Erreur création journal', e);
        const errorMessage = e.error?.message || 'Une erreur est survenue lors de la création.';
        this.showModal(errorMessage, false);
      }
    });
  }

  editJournal(journal: any) {
    this.isEditMode = true;
    this.editingJournalId = journal.id_journal;
    this.newJournal.nom_journal = journal.nom_journal;
    this.newJournal.nom_projet = journal.nom_projet;

    // Définir les budgets sélectionnés
    this.selectedBudgetIds = journal.budgets.map((b: any) => b.id_budget);

    // Définir les valideurs sélectionnés avec leur ordre
    this.selectedValideurs = journal.valideurs.map((v: any) => ({
      user_id: v.user_id, 
      ordre: v.ordre 
    }));
  }

  updateJournal() {
    if (!this.editingJournalId) {
      return;
    }
    if (this.selectedValideurs.length === 0) {
      this.showModal('Veuillez sélectionner au moins un valideur.', false);
      return;
    }

    const data = {
      nom_journal: this.newJournal.nom_journal,
      nom_projet: this.newJournal.nom_projet,
      budgets: this.selectedBudgetIds.map(id => ({ id_budget: id })), 
      valideurs: this.selectedValideurs,
    };

    this.journalApiService.updateJournal(this.editingJournalId, data).subscribe({
      next: () => {
        this.showModal('Journal mis à jour avec succès !', true);
        this.loadJournals();
        this.resetForm();
        this.isEditMode = false;
        this.editingJournalId = null;
      },
      error: (e: HttpErrorResponse) => {
        console.error('Erreur mise à jour journal', e);
        const errorMessage = e.error?.message || 'Une erreur est survenue lors de la mise à jour.';
        this.showModal(errorMessage, false);
      }
    });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingJournalId = null;
    this.resetForm();
  }

  deleteJournal(id: number) {
    // Note : Pour une meilleure expérience utilisateur, remplacez "confirm()" par un modal personnalisé.
    if (confirm('Êtes-vous sûr de vouloir supprimer ce journal ?')) {
      this.journalApiService.deleteJournal(id).subscribe({
        next: () => {
          this.showModal('Journal supprimé avec succès !', true);
          this.loadJournals();
        },
        error: (e: HttpErrorResponse) => {
          console.error('Erreur suppression journal', e);
          const errorMessage = e.error?.message || 'Une erreur est survenue lors de la suppression.';
          this.showModal(errorMessage, false);
        }
      });
    }
  }

  resetForm() {
    this.newJournal = { nom_journal: '', nom_projet: '' };
    this.selectedBudgetIds = [];
    this.selectedValideurs = [];
    // Réinitialiser la sélection dans le <select> pour une meilleure UX
    const selectElement = document.querySelector('select[name="valideurs"]');
    if (selectElement) {
        (selectElement as HTMLSelectElement).selectedIndex = -1;
    }
  }
}
