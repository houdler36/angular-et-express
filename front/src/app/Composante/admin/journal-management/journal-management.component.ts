import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importez le service
import { JournalApiService } from '../../../services/journal-api.service'; 
//import { HttpClientModule } from '@angular/common/http'; // Ajouté pour la dépendance

@Component({
  selector: 'app-journal-management',
  standalone: true,
  imports: [CommonModule, FormsModule], // Ajoutez HttpClientModule
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
  journals: any[] = [];
  
  constructor(private journalApiService: JournalApiService) {}

  ngOnInit() {
    this.loadBudgets();
    this.loadJournals();
  }

  loadBudgets() {
    this.journalApiService.getAllBudgets().subscribe({
      next: (data) => {
        // Filtrez les budgets de l'année en cours
        const currentYear = new Date().getFullYear();
        this.budgetsDisponibles = data.filter(b => b.annee_fiscale === currentYear);
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

  addJournal() {
    if (this.selectedBudgetIds.length === 0) {
      alert('Veuillez sélectionner au moins un budget.');
      return;
    }

    const data = {
      ...this.newJournal,
      budgetIds: this.selectedBudgetIds // Le backend attend "budgetIds"
    };

    this.journalApiService.createJournal(data).subscribe({
      next: (res) => {
        console.log('Journal créé avec succès', res);
        this.loadJournals(); // Recharge la liste des journaux après la création
        this.resetForm();
      },
      error: (e) => console.error('Erreur lors de la création du journal', e)
    });
  }

  resetForm() {
    this.newJournal = {
      nom_journal: '',
      nom_projet: '',
    };
    this.selectedBudgetIds = [];
  }
}