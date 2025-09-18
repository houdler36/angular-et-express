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
  loading = false;
  errorMessage: string | null = null;

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.demandeService.getProjetsWithBudgets().subscribe({
      next: (data) => (this.projets = data),
      error: (err) => (this.errorMessage = 'Erreur chargement projets : ' + err.message)
    });
  }

  // --- Charger les demandes quand on clique sur un budget ---
  loadDemandesByProjetAndBudget(nomProjet: string, codeBudget: string): void {
    this.loading = true;
    this.demandes = [];
    this.errorMessage = null;

    this.demandeService.getRapportFiltre(nomProjet, codeBudget).subscribe({
      next: (data) => {
        this.demandes = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la récupération des demandes: ' + err.message;
        this.loading = false;
      }
    });
  }

  // --- Recherche par nomProjet avec le bouton ---
  loadDemandes(): void {
    if (!this.nomProjet) {
      this.errorMessage = 'Veuillez sélectionner un projet.';
      this.demandes = [];
      return;
    }
    // charge toutes les demandes du projet (pas filtré par code budget)
    this.loadDemandesByProjetAndBudget(this.nomProjet, '');
  }
}
