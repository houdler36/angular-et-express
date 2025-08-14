import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalApiService } from '../../../services/journal-api.service';

@Component({
  selector: 'app-journal-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-management.component.html',
  styleUrls: ['./journal-management.component.css']
})
export class JournalManagementComponent implements OnInit {

  newJournal = {
    nom_journal: '',
    nom_projet: '',
  };

  budgetsDisponibles: any[] = [];
  selectedBudgetIds: number[] = [];

  valideursDisponibles: any[] = [];
  selectedValideurs: { user_id: number, ordre: number }[] = [];

  journals: any[] = [];

  constructor(private journalApiService: JournalApiService) {}

  ngOnInit() {
    this.loadBudgets();
    this.loadValideurs();
    this.loadJournals();
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
      next: (data) => {
        this.valideursDisponibles = data;
      },
      error: (e) => console.error(e)
    });
  }

  loadJournals() {
    this.journalApiService.getAllJournals().subscribe({
      next: (data) => {
        this.journals = data;
      },
      error: (e) => console.error(e)
    });
  }

isValideurSelected(id: number): boolean {
  return this.selectedValideurs.some(v => v.user_id === id);
}

toggleValideur(valideur: any, event: MouseEvent) {
  event.preventDefault(); // Empêche la sélection native

  const index = this.selectedValideurs.findIndex(v => v.user_id === valideur.id);

  if (index >= 0) {
    // Retirer le valideur
    this.selectedValideurs.splice(index, 1);
  } else {
    // Ajouter à la fin avec ordre
    this.selectedValideurs.push({
      user_id: valideur.id,
      ordre: this.selectedValideurs.length + 1
    });
  }
}


  addJournal() {
    if (this.selectedBudgetIds.length === 0) {
      alert('Veuillez sélectionner au moins un budget.');
      return;
    }
    if (this.selectedValideurs.length === 0) {
      alert('Veuillez sélectionner au moins un valideur.');
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
        this.loadJournals();
        this.resetForm();
      },
      error: (e) => console.error('Erreur création journal', e)
    });
  }

  resetForm() {
    this.newJournal = { nom_journal: '', nom_projet: '' };
    this.selectedBudgetIds = [];
    this.selectedValideurs = [];
  }
}