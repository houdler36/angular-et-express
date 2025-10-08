import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-rapport-projet',
  templateUrl: './rapport-projet.component.html',
  styleUrls: ['./rapport-projet.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DatePipe]
})
export class RapportProjetComponent implements OnInit {
  projets: any[] = [];
  nomProjet: string = '';
  periode: string = 'annee';
  annee: number = new Date().getFullYear();
  demandes: any[] = [];
  demandesFiltrees: any[] = [];
  loading = false;
  errorMessage: string | null = null;
  selectedBudget: any = null;
  stats: any = {};
  searchTerm: string = '';

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.loadProjets();
  }

  loadProjets(): void {
    this.loading = true;
    this.demandeService.getProjetsWithBudgets().subscribe({
      next: (data) => {
        this.projets = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur chargement projets : ' + err.message;
        this.loading = false;
      }
    });
  }

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
        this.selectedBudget = projet.budgets[0];
      } else {
        this.errorMessage = "Aucun budget trouvé pour ce projet.";
        this.loading = false;
        return;
      }
    } else {
      const projet = this.projets.find(p => p.nom_projet === nomProjet);
      this.selectedBudget = projet.budgets.find((b: any) => b.code_budget === budget);
    }

    this.demandeService.getRapportFiltre(nomProjet, budget).subscribe({
      next: (data) => {
        this.demandes = data;
        this.filterByPeriode();
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la récupération des demandes: ' + err.message;
        this.loading = false;
      }
    });
  }

  loadDemandes(): void {
    if (!this.nomProjet) {
      this.errorMessage = 'Veuillez sélectionner un projet.';
      this.demandes = [];
      this.demandesFiltrees = [];
      this.stats = {};
      return;
    }
    this.loadDemandesByProjetAndBudget(this.nomProjet);
  }

  filterByPeriode(): void {
    if (this.periode === 'annee') {
      this.demandesFiltrees = [...this.demandes];
    } else {
      const trimestre = this.periode;
      this.demandesFiltrees = this.demandes.map(d => ({
        ...d,
        details: d.details.filter((detail: any) =>
          this.isInTrimestre(d.date_approuvee, trimestre)
        )
      })).filter(d => d.details.length > 0);
    }
    this.calculateStats();
  }

  isInTrimestre(dateString: string, trimestre: string): boolean {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;

    switch (trimestre) {
      case 'T1': return month >= 1 && month <= 3;
      case 'T2': return month >= 4 && month <= 6;
      case 'T3': return month >= 7 && month <= 9;
      case 'T4': return month >= 10 && month <= 12;
      default: return true;
    }
  }

  calculateStats(): void {
    const totalMontant = this.demandesFiltrees.reduce((sum, demande) => {
      return sum + demande.details.reduce((detailSum: number, detail: any) => 
        detailSum + (detail.amount || 0), 0);
    }, 0);

    const nombreDemandes = this.demandesFiltrees.length;

    this.stats = {
      totalMontant,
      nombreDemandes,
      montantMoyen: nombreDemandes > 0 ? totalMontant / nombreDemandes : 0
    };
  }

  // Méthodes pour les statistiques (utilisent selectedBudget)
  getSelectedBudget(): number {
    if (!this.selectedBudget) return 0;
    
    switch (this.periode) {
      case 'T1': return this.selectedBudget.budget_trimestre_1 || 0;
      case 'T2': return this.selectedBudget.budget_trimestre_2 || 0;
      case 'T3': return this.selectedBudget.budget_trimestre_3 || 0;
      case 'T4': return this.selectedBudget.budget_trimestre_4 || 0;
      default: return this.selectedBudget.budget_annuel || 0;
    }
  }

  getSelectedResteBudget(): number {
    if (!this.selectedBudget) return 0;
    
    switch (this.periode) {
      case 'T1': return this.selectedBudget.reste_trimestre_1 || 0;
      case 'T2': return this.selectedBudget.reste_trimestre_2 || 0;
      case 'T3': return this.selectedBudget.reste_trimestre_3 || 0;
      case 'T4': return this.selectedBudget.reste_trimestre_4 || 0;
      default: return this.selectedBudget.reste_budget || 0;
    }
  }

  // Méthodes pour le tableau (prennent un paramètre budget)
  getBudgetForPeriod(budget: any): number {
    if (!budget) return 0;
    
    switch (this.periode) {
      case 'T1': return budget.budget_trimestre_1 || 0;
      case 'T2': return budget.budget_trimestre_2 || 0;
      case 'T3': return budget.budget_trimestre_3 || 0;
      case 'T4': return budget.budget_trimestre_4 || 0;
      default: return budget.budget_annuel || 0;
    }
  }

  getResteBudgetForPeriod(budget: any): number {
    if (!budget) return 0;
    
    switch (this.periode) {
      case 'T1': return budget.reste_trimestre_1 || 0;
      case 'T2': return budget.reste_trimestre_2 || 0;
      case 'T3': return budget.reste_trimestre_3 || 0;
      case 'T4': return budget.reste_trimestre_4 || 0;
      default: return budget.reste_budget || 0;
    }
  }

  getTauxUtilisation(): number {
    const budget = this.getSelectedBudget();
    if (budget === 0) return 0;
    return (this.stats.totalMontant / budget) * 100;
  }

  exportToCSV(): void {
    const headers = ['Code Budget', 'Date', 'Journal', 'Bénéficiaire', 'Libellé', 'Montant'];
    const csvData = this.demandesFiltrees.flatMap(demande => 
      demande.details.map((detail: any) => [
        detail.budget?.code_budget || '',
        demande.date_approuvee,
        demande.journal?.nom_journal || '',
        detail.beneficiaire || '',
        detail.libelle,
        detail.amount
      ])
    );

    const csvContent = [headers, ...csvData]
      .map(row => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_${this.nomProjet}_${this.periode}_${this.annee}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}