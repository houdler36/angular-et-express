import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';
import { Demande } from '../../../models/demande';

@Component({
  selector: 'app-dashboard-user',
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class DashboardUserComponent implements OnInit {
  totalDemandes: number = 0;
  demandesEnAttente: number = 0;
  demandesApprouvees: number = 0;
  demandesRejetees: number = 0;

  lastDemandes: Demande[] = [];
  errorMessage: string = '';

  constructor(private demandeService: DemandeService) { }

  ngOnInit(): void {
    this.loadDemandes();
    this.loadDemandeStats();
  }

  loadDemandes(): void {
    console.log("Chargement des dernières demandes...");
    this.demandeService.getAllDemandes().subscribe({
      next: (data: Demande[]) => {
        this.lastDemandes = data.slice(0, 4);
        console.log("Demandes chargées :", this.lastDemandes);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des demandes : ' + (err.error.message || err.message);
        console.error(this.errorMessage, err);
      }
    });
  }

  loadDemandeStats(): void {
    console.log("Chargement des statistiques de demandes...");
    this.demandeService.getDemandeStats().subscribe({
      next: (stats: { status: string, total: number }[]) => { // Le type est maintenant un tableau d'objets {status, total}
        // Réinitialiser les totaux avant de les recalculer
        this.totalDemandes = 0;
        this.demandesEnAttente = 0;
        this.demandesApprouvees = 0;
        this.demandesRejetees = 0;

        // Parcourir le tableau de statistiques et agréger les totaux
        stats.forEach(stat => {
          this.totalDemandes += stat.total; // Somme de tous les totaux pour le total général

          if (stat.status === 'Pending') {
            this.demandesEnAttente = stat.total;
          } else if (stat.status === 'Approved') {
            this.demandesApprouvees = stat.total;
          } else if (stat.status === 'Rejected') {
            this.demandesRejetees = stat.total;
          }
          // Ajoutez d'autres conditions si vous avez d'autres statuts
        });
        console.log("Statistiques chargées et agrégées :", {
          totalDemandes: this.totalDemandes,
          demandesEnAttente: this.demandesEnAttente,
          demandesApprouvees: this.demandesApprouvees,
          demandesRejetees: this.demandesRejetees
        });
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des statistiques : ' + (err.error.message || err.message);
        console.error(this.errorMessage, err);
      }
    });
  }
}
