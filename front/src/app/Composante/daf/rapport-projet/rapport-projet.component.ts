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
  periode: string = 'annee'; // 'annee', 'T1', 'T2', 'T3', 'T4'
  demandes: any[] = [];
  demandesFiltrees: any[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.demandeService.getProjetsWithBudgets().subscribe({
      next: (data) => (this.projets = data),
      error: (err) => (this.errorMessage = 'Erreur chargement projets : ' + err.message)
    });
  }

  // Charger les demandes d’un projet et d’un budget
  loadDemandesByProjetAndBudget(nomProjet: string, codeBudget?: string): void {
    this.loading = true;
    this.demandes = [];
    this.demandesFiltrees = [];
    this.errorMessage = null;

    let budget: string = codeBudget || '';
    if (!budget) {
      const projet = this.projets.find(p => p.nom_projet === nomProjet);
      if (projet && projet.budgets && projet.budgets.length > 0) {
        budget = projet.budgets[0].code_budget;
      } else {
        this.errorMessage = "Aucun budget trouvé pour ce projet.";
        this.loading = false;
        return;
      }
    }

    this.demandeService.getRapportFiltre(nomProjet, budget).subscribe({
      next: (data) => {
        this.demandes = data;
        this.filterByPeriode(); // filtrer selon la période sélectionnée
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la récupération des demandes: ' + err.message;
        this.loading = false;
      }
    });
  }

  // Charger toutes les demandes pour le projet sélectionné
  loadDemandes(): void {
    if (!this.nomProjet) {
      this.errorMessage = 'Veuillez sélectionner un projet.';
      this.demandes = [];
      this.demandesFiltrees = [];
      return;
    }
    this.loadDemandesByProjetAndBudget(this.nomProjet);
  }

  // Filtrer les demandes selon le trimestre sélectionné
  filterByPeriode(): void {
    if (this.periode === 'annee') {
      this.demandesFiltrees = [...this.demandes];
    } else {
      const trimestre = this.periode; // 'T1', 'T2', 'T3', 'T4'
      this.demandesFiltrees = this.demandes.map(d => ({
        ...d,
        details: d.details.filter((detail: any) =>
          this.isInTrimestre(d.date_approuvee, trimestre)
        )
      })).filter(d => d.details.length > 0);
    }
  }

  // Vérifier si une date est dans le trimestre sélectionné
  isInTrimestre(dateString: string, trimestre: string): boolean {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 1 = Janvier, 12 = Décembre

    switch (trimestre) {
      case 'T1': return month >= 1 && month <= 3;
      case 'T2': return month >= 4 && month <= 6;
      case 'T3': return month >= 7 && month <= 9;
      case 'T4': return month >= 10 && month <= 12;
      default: return true;
    }
  }
}
