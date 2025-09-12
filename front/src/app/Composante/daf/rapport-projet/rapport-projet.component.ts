import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-rapport-projet',
  templateUrl: './rapport-projet.component.html',
  styleUrls: ['./rapport-projet.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, CurrencyPipe, DatePipe]
})
export class RapportProjetComponent implements OnInit {
  projets: any[] = [];          
  nomProjet: string = '';       
  demandes: any[] = [];         

  codeBudget: string = '';      // pour Table 1
  budgetInfo: any[] = [];       // pour Table 2

  loading = false;
  loadingBudget = false;
  errorMessage: string | null = null;
  budgetErrorMessage: string | null = null;

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.demandeService.getProjetsWithBudgets().subscribe({
      next: (data) => this.projets = data,
      error: (err) => this.errorMessage = 'Erreur chargement projets : ' + err.message
    });
  }

  // ---- TABLE 1 : recherche par codeBudget ----
  loadBudgetInfo(): void {
    if (!this.codeBudget) {
      this.budgetErrorMessage = 'Veuillez entrer un code budget.';
      this.budgetInfo = [];
      return;
    }
    this.loadingBudget = true;
    this.demandeService.getBudgetInfoByCode(this.codeBudget).subscribe({
      next: (data) => {
        this.budgetInfo = data;
        this.loadingBudget = false;
      },
      error: (err) => {
        this.budgetErrorMessage = err.message || 'Erreur lors du chargement des informations du budget';
        this.budgetInfo = [];
        this.loadingBudget = false;
      }
    });
  }

  // ---- TABLE 2 : cliquer sur projet pour charger Table 3 ----
  onSelectProjet(projet: any): void {
    this.nomProjet = projet.nom_projet;
    this.loadDemandesDirect(this.nomProjet);
  }

  // ---- TABLE 3 : charger demandes ----
  loadDemandesDirect(nomProjet: string): void {
    if (!nomProjet) return;
    this.loading = true;
    this.demandes = [];
    this.demandeService.getRapportByNomProjet(nomProjet).subscribe({
      next: (data) => {
        this.demandes = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des demandes';
        this.loading = false;
      }
    });
  }
}
