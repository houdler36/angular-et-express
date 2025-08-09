// Fichier: src/app/Composante/admin/budget-management/budget-management.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetApiService } from '../../../services/budget-api.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, HttpClientModule],
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
    description: '' // <-- Ajout de la description ici
  };

  budgetsAffiches: any[] = [];
  allBudgets: any[] = [];
  currentYear = new Date().getFullYear();

  constructor(private budgetApiService: BudgetApiService) {}

  ngOnInit(): void {
    this.loadBudgets();
  }

  loadBudgets() {
    this.budgetApiService.getAllBudgets().subscribe({
      next: (data) => {
        this.allBudgets = data;
        this.filterBudgetsByYear();
      },
      error: (e) => console.error(e)
    });
  }

  addBudget() {
    this.budgetApiService.createBudget(this.newBudget).subscribe({
      next: (res) => {
        console.log('Budget créé avec succès', res);
        this.loadBudgets();
        this.resetForm();
      },
      error: (e) => console.error('Erreur lors de la création du budget', e)
    });
  }

  filterBudgetsByYear() {
    this.budgetsAffiches = this.allBudgets.filter(budget => budget.annee_fiscale === this.currentYear);
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
      description: '' // <-- Réinitialisez la description
    };
  }
}