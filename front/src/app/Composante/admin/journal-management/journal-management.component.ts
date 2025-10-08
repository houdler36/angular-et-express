import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalApiService } from '../../../services/journal-api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-journal-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-management.component.html',
  styleUrls: ['./journal-management.component.css']
})
export class JournalManagementComponent implements OnInit {

  // Formulaire pour nouveau journal ou édition
  newJournal = {
    nom_journal: '',
    nom_projet: '',
    solde: 0, // Champ solde ajouté
  };

  budgetsDisponibles: any[] = [];
  selectedBudgetIds: number[] = [];
  valideursDisponibles: any[] = [];
  selectedValideurs: { user_id: number, ordre: number }[] = [];
  journals: any[] = [];

  // Mode édition
  isEditMode = false;
  editingJournalId: number | null = null;

  // Pop-up
  isModalVisible = false;
  modalTitle = '';
  modalMessage = '';
  isSuccess = false;

  // Loading
  isLoading = false;

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

  loadValideurs() {
    this.journalApiService.getAllRhUsers().subscribe({ 
      next: (data) => this.valideursDisponibles = data,
      error: (e) => console.error(e)
    });
  }

  loadJournals() {
    this.journalApiService.getAllJournals().subscribe({
      next: (data) => {
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

  toggleValideur(valideur: any, event: MouseEvent) {
    event.preventDefault();
    const index = this.selectedValideurs.findIndex(v => v.user_id === valideur.id);

    if (index >= 0) {
      this.selectedValideurs.splice(index, 1);
      this.selectedValideurs.forEach((v, i) => v.ordre = i + 1);
    } else {
      this.selectedValideurs.push({ user_id: valideur.id, ordre: this.selectedValideurs.length + 1 });
    }
  }

  showModal(message: string, isSuccess: boolean) {
    this.isSuccess = isSuccess;
    this.modalTitle = isSuccess ? 'Succès !' : 'Erreur !';
    this.modalMessage = message;
    this.isModalVisible = true;
  }

  hideModal() {
    this.isModalVisible = false;
  }

  addJournal() {
    if (this.selectedBudgetIds.length === 0) {
      this.showModal('Veuillez sélectionner au moins un budget.', false);
      return;
    }
    if (this.selectedValideurs.length === 0) {
      this.showModal('Veuillez sélectionner au moins un valideur.', false);
      return;
    }

    this.isLoading = true;
    const data = {
      nom_journal: this.newJournal.nom_journal,
      nom_projet: this.newJournal.nom_projet,
      solde: this.newJournal.solde, // transmission du solde
      budgetIds: this.selectedBudgetIds,
      valideurs: this.selectedValideurs
    };

    this.journalApiService.createJournal(data).subscribe({
      next: () => {
        this.isLoading = false;
        this.showModal('Journal créé avec succès !', true);
        this.loadJournals();
        this.resetForm();
      },
      error: (e: HttpErrorResponse) => {
        this.isLoading = false;
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
    this.newJournal.solde = journal.solde; // récupération du solde

    this.selectedBudgetIds = journal.budgets.map((b: any) => b.id_budget);
    this.selectedValideurs = journal.valideurs.map((v: any) => ({ user_id: v.user_id, ordre: v.ordre }));
  }

  updateJournal() {
    if (!this.editingJournalId) return;
    if (this.selectedValideurs.length === 0) {
      this.showModal('Veuillez sélectionner au moins un valideur.', false);
      return;
    }

    this.isLoading = true;
    const data = {
      nom_journal: this.newJournal.nom_journal,
      nom_projet: this.newJournal.nom_projet,
      solde: this.newJournal.solde, // mise à jour du solde
      budgetIds: this.selectedBudgetIds,
      valideurs: this.selectedValideurs,
    };

    this.journalApiService.updateJournal(this.editingJournalId, data).subscribe({
      next: () => {
        this.isLoading = false;
        this.showModal('Journal mis à jour avec succès !', true);
        this.loadJournals();
        this.resetForm();
        this.isEditMode = false;
        this.editingJournalId = null;
      },
      error: (e: HttpErrorResponse) => {
        this.isLoading = false;
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
    this.isLoading = true;
    this.journalApiService.deleteJournal(id).subscribe({
      next: () => {
        this.isLoading = false;
        this.showModal('Journal supprimé avec succès !', true);
        this.loadJournals();
      },
      error: (e: HttpErrorResponse) => {
        this.isLoading = false;
        const errorMessage = e.error?.message || 'Une erreur est survenue lors de la suppression.';
        this.showModal(errorMessage, false);
      }
    });
  }

  resetForm() {
    this.newJournal = { nom_journal: '', nom_projet: '', solde: 0 };
    this.selectedBudgetIds = [];
    this.selectedValideurs = [];
    const selectElement = document.querySelector('select[name="valideurs"]');
    if (selectElement) {
        (selectElement as HTMLSelectElement).selectedIndex = -1;
    }
  }
}
