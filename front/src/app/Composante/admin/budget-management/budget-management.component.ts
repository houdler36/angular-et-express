// Fichier: src/app/Composante/admin/budget-management/budget-management.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetApiService } from '../../../services/budget-api.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './budget-management.component.html',
  styleUrls: ['./budget-management.component.css']
})
export class BudgetManagementComponent implements OnInit {

  newBudget = {
    code_budget: '',
    annee_fiscale: new Date().getFullYear(),
    budget_annuel: 0,
    budget_trimestre_1: 0,
    budget_trimestre_2: 0,
    budget_trimestre_3: 0,
    budget_trimestre_4: 0,
    description: ''
  };

  budgetsAffiches: any[] = [];
  allBudgets: any[] = [];
  currentYear = new Date().getFullYear();
  selectedYear: number = this.currentYear;
  isBudgetInvalid: boolean = false;
  sumTrimestres: number = 0;
  showReste: boolean = false;
  searchTerm: string = '';
  isEditMode: boolean = false;
  selectedBudgetId: number | null = null;
  showDeleteModal: boolean = false;
  budgetToDelete: number | null = null;

  constructor(private budgetApiService: BudgetApiService) {}

  ngOnInit(): void {
    this.loadBudgets();
  }

  loadBudgets() {
    this.budgetApiService.getAllBudgets().subscribe({
      next: (data) => {
        this.allBudgets = data;
        this.applyFilters();
      },
      error: (e) => console.error(e)
    });
  }

  addBudget() {
    if (this.isBudgetInvalid) {
      console.error('Validation échouée : La somme des trimestres dépasse le budget annuel.');
      return;
    }
    
    const budgetToSend = {
      ...this.newBudget,
      budget_annuel: Number(this.newBudget.budget_annuel) || 0,
      budget_trimestre_1: Number(this.newBudget.budget_trimestre_1) || 0,
      budget_trimestre_2: Number(this.newBudget.budget_trimestre_2) || 0,
      budget_trimestre_3: Number(this.newBudget.budget_trimestre_3) || 0,
      budget_trimestre_4: Number(this.newBudget.budget_trimestre_4) || 0,
      annee_fiscale: Number(this.newBudget.annee_fiscale)
    };

    this.budgetApiService.createBudget(budgetToSend).subscribe({
      next: (res) => {
        console.log('Budget créé avec succès', res);
        this.loadBudgets();
        this.resetForm();
      },
      error: (e) => console.error('Erreur lors de la création du budget', e)
    });
  }

  checkBudgetValidity() {
    this.sumTrimestres = (
      (Number(this.newBudget.budget_trimestre_1) || 0) +
      (Number(this.newBudget.budget_trimestre_2) || 0) +
      (Number(this.newBudget.budget_trimestre_3) || 0) +
      (Number(this.newBudget.budget_trimestre_4) || 0)
    );
    
    this.isBudgetInvalid = Number(this.newBudget.budget_annuel) < this.sumTrimestres;
  }
  
  applyFilters(yearInput?: number | string) {
    
    if (yearInput !== undefined) {
      const yearToFilter = typeof yearInput === 'string' ? parseInt(yearInput, 10) : yearInput;
      if (!isNaN(yearToFilter) && yearToFilter > 0) {
        this.selectedYear = yearToFilter;
      } else if (yearInput === null || yearInput === undefined || yearInput === '') {
        this.selectedYear = this.currentYear;
      }
    }

    let filteredByYear = this.allBudgets.filter(budget => budget.annee_fiscale === this.selectedYear);

    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      this.budgetsAffiches = filteredByYear.filter(budget => {
        const code = budget.code_budget ? budget.code_budget.toLowerCase() : '';
        const description = budget.description ? budget.description.toLowerCase() : '';

        return code.includes(term) || description.includes(term);
      });
    } else {
      this.budgetsAffiches = filteredByYear;
    }
  }

  // Renommage de la méthode précédente pour être appelée par applyFilters
  filterBudgetsByYear(year: number | string) {
    this.applyFilters(year);
  }
  
  toggleReste() {
    this.showReste = !this.showReste;
  }

  resetForm() {
    this.newBudget = {
      code_budget: '',
      annee_fiscale: this.currentYear,
      budget_annuel: 0,
      budget_trimestre_1: 0,
      budget_trimestre_2: 0,
      budget_trimestre_3: 0,
      budget_trimestre_4: 0,
      description: ''
    };
    this.isBudgetInvalid = false;
    this.sumTrimestres = 0;
    this.isEditMode = false;
    this.selectedBudgetId = null;
  }

  editBudget(budget: any) {
    this.newBudget = { ...budget };
    this.isEditMode = true;
    this.selectedBudgetId = budget.id_budget;
    this.checkBudgetValidity();
  }

  updateBudget() {
    if (this.isBudgetInvalid || !this.selectedBudgetId) {
      console.error('Validation échouée ou ID manquant.');
      return;
    }

    const budgetToSend = {
      ...this.newBudget,
      budget_annuel: Number(this.newBudget.budget_annuel) || 0,
      budget_trimestre_1: Number(this.newBudget.budget_trimestre_1) || 0,
      budget_trimestre_2: Number(this.newBudget.budget_trimestre_2) || 0,
      budget_trimestre_3: Number(this.newBudget.budget_trimestre_3) || 0,
      budget_trimestre_4: Number(this.newBudget.budget_trimestre_4) || 0,
      annee_fiscale: Number(this.newBudget.annee_fiscale)
    };

    this.budgetApiService.updateBudget(this.selectedBudgetId, budgetToSend).subscribe({
      next: (res) => {
        console.log('Budget modifié avec succès', res);
        this.loadBudgets();
        this.resetForm();
      },
      error: (e) => console.error('Erreur lors de la modification du budget', e)
    });
  }

  openDeleteModal(id: number) {
    this.budgetToDelete = id;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.budgetToDelete = null;
  }

  confirmDelete() {
    if (this.budgetToDelete) {
      this.budgetApiService.deleteBudget(this.budgetToDelete).subscribe({
        next: (res) => {
          console.log('Budget supprimé avec succès', res);
          this.loadBudgets();
          this.closeDeleteModal();
        },
        error: (e) => console.error('Erreur lors de la suppression du budget', e)
      });
    }
  }

  deleteBudget(id: number) {
    this.openDeleteModal(id);
  }

  submitBudget() {
    if (this.isEditMode) {
      this.updateBudget();
    } else {
      this.addBudget();
    }
  }
}
