import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandeService } from '../../../services/demande.service';

@Component({
  selector: 'app-rapport-demande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rapport-demande.component.html',
  styleUrls: ['./rapport-demande.component.scss']
})
export class RapportdemandeComponent implements OnInit {
  journals: any[] = [];
  selectedJournalId: number | null = null;
  demandes: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.loadJournals();
  }

  loadJournals() {
    this.demandeService.getJournals().subscribe({
      next: data => this.journals = data,
      error: err => this.errorMessage = 'Erreur lors du chargement des journaux'
    });
  }

  loadRapport() {
    if (!this.selectedJournalId) return;

    this.loading = true;
    this.errorMessage = '';
    this.demandes = [];

    this.demandeService.getRapportDemandesApprouvees(this.selectedJournalId).subscribe({
      next: data => {
        this.demandes = data;
        this.loading = false;
      },
      error: err => {
        this.errorMessage = 'Erreur lors du chargement du rapport';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Format date avec heure
  formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // Format montant en € avec séparateur
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-';
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  // Optionnel : Total Décaissement
  getTotalDecaissement(): number {
    return this.demandes
      .filter(d => d.type === 'DED')
      .reduce((sum, d) => sum + (d.montant_total || 0), 0);
  }

  // Optionnel : Total Encaissement
  getTotalEncaissement(): number {
    return this.demandes
      .filter(d => d.type === 'Recette' || d.type === 'ERD')
      .reduce((sum, d) => sum + (d.montant_total || 0), 0);
  }
}
