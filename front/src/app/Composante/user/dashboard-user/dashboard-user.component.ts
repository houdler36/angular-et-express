// src/app/Composante/user/dashboard-user/dashboard-user.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DemandeService } from '../../../services/demande.service';
import { DemandeUpdateService } from '../../../services/demande-update.service';
import { Demande } from '../../../models/demande';

@Component({
  selector: 'app-dashboard-user',
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ]
})
export class DashboardUserComponent implements OnInit, OnDestroy {
  totalDemandes: number = 0;
  demandesEnAttente: number = 0;
  demandesApprouvees: number = 0;
  demandesRejetees: number = 0;
  
  demandeStats: { status: string, count: number }[] = [];
  lastDemandes: Demande[] = [];
  errorMessage: string = '';
  private updateSubscription!: Subscription;

  constructor(
    private demandeService: DemandeService,
    private demandeUpdateService: DemandeUpdateService
  ) { }

  ngOnInit(): void {
    this.loadDemandes();
    this.loadDemandeStats();

    this.updateSubscription = this.demandeUpdateService.demandeUpdated$.subscribe(() => {
      console.log('Notification de mise à jour reçue. Rafraîchissement des statistiques...');
      this.loadDemandeStats();
      this.loadDemandes();
    });
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  loadDemandes(): void {
    console.log("Chargement des dernières demandes...");
    this.demandeService.getAllDemandes().subscribe({
      next: (data: Demande[]) => {
        this.lastDemandes = data;
        console.log("Demandes chargées :", this.lastDemandes);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des demandes : ' + (err.error?.message || err.message);
        console.error(this.errorMessage, err);
      }
    });
  }

  loadDemandeStats(): void {
    console.log("Chargement des statistiques de demandes...");
    this.demandeService.getDemandeStats().subscribe({
      next: (stats) => {
        console.log("Statistiques reçues du backend :", stats);
        
        this.totalDemandes = 0;
        this.demandesEnAttente = 0;
        this.demandesApprouvees = 0;
        this.demandesRejetees = 0;
        
        // Correction : Itérer sur les clés de l'objet "stats"
        if (stats) {
          Object.keys(stats).forEach(status => {
            const count = stats[status];
            this.totalDemandes += count;

            switch (status.toLowerCase()) {
              case 'en attente':
              case 'en_attente':
              case 'pending':
                this.demandesEnAttente = count;
                break;
              case 'validé':
              case 'approuvée':
              case 'approuvé':
              case 'approved':
                this.demandesApprouvees = count;
                break;
              case 'refusé':
              case 'rejetée':
              case 'rejected':
                this.demandesRejetees = count;
                break;
            }
          });
        }

        console.log("Statistiques agrégées :", {
          totalDemandes: this.totalDemandes,
          demandesEnAttente: this.demandesEnAttente,
          demandesApprouvees: this.demandesApprouvees,
          demandesRejetees: this.demandesRejetees
        });
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des statistiques : ' + (err.error?.message || err.message);
        console.error(this.errorMessage, err);
      }
    });
  }
}