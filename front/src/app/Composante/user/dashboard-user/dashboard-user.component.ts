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
  demandesApprouvees: number = 0; // Ces valeurs seront calculées
  demandesRejetees: number = 0; // Ces valeurs seront calculées

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
    
    // Affiche toutes les demandes, ou tu peux filtrer par statut si besoin
    this.demandeService.getAllDemandes().subscribe({
      next: (data: any[]) => {
        this.lastDemandes = data;
        console.log("Demandes chargées :", this.lastDemandes);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des demandes : ' + err.message;
        console.error(this.errorMessage, err);
      }
    });
  }

  loadDemandeStats(): void {
    console.log("Chargement des statistiques de demandes...");
    this.demandeService.getAllDemandes().subscribe({
      next: (data: Demande[]) => {
        // Aggrégation des données côté client
        this.totalDemandes = data.length;
        this.demandesEnAttente = data.filter(d => d.status === 'En attente').length;
        this.demandesApprouvees = data.filter(d => d.status === 'Approuvée').length;
        this.demandesRejetees = data.filter(d => d.status === 'Rejetée').length;
        
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
