// Fichier: dashboard-user.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // N'oubliez pas d'importer FormsModule pour ngModel
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
    CommonModule,
    FormsModule // Ajout de FormsModule pour la liaison bidirectionnelle ngModel
  ]
})
export class DashboardUserComponent implements OnInit, OnDestroy {
  totalDemandes: number = 0;
  demandesEnAttente: number = 0;
  demandesApprouvees: number = 0;
  demandesRejetees: number = 0;

  demandeStats: { status: string, count: number }[] = [];
  
  // Nouveaux tableaux et propriétés pour le filtrage
  allDemandes: Demande[] = [];
  lastDemandes: Demande[] = [];
  searchTerm: string = '';

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
    console.log("Chargement des demandes...");
    
    this.demandeService.getAllDemandes().subscribe({
      next: (data: any[]) => {
        // Conversion de la chaîne de date en un objet Date pour le formatage dans le template
        this.allDemandes = data.map(demande => ({
          ...demande,
          date: new Date(demande.date)
        }));

        this.lastDemandes = this.allDemandes; // Affiche toutes les demandes
        console.log("Demandes chargées :", this.allDemandes);
        
        // Applique le filtre initial si l'utilisateur avait déjà un terme de recherche
        if (this.searchTerm) {
          this.applyFilter();
        }
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des demandes : ' + err.message;
        console.error(this.errorMessage, err);
      }
    });
  }

  loadDemandeStats(): void {
    console.log("Chargement des statistiques de demandes...");
    this.demandeService.getDemandeStats().subscribe({
      next: (stats) => {
        console.log("Statistiques reçues du backend :", stats);
        
        this.totalDemandes = stats.total;
        this.demandesEnAttente = stats.enAttente;
        this.demandesApprouvees = stats.finalisees;
        this.demandesRejetees = 0;
        
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

  /**
   * Applique le filtre de recherche sur la liste des demandes.
   */
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (!term) {
      // Si le champ de recherche est vide, on affiche toutes les demandes
      this.lastDemandes = this.allDemandes;
    } else {
      // Sinon, on filtre toutes les demandes
      this.lastDemandes = this.allDemandes.filter(demande => {
        // Formatage de la date pour la recherche
        const dateFormatted = (demande.date as any) instanceof Date ?
          `${(demande.date as any).getDate().toString().padStart(2, '0')}-${((demande.date as any).getMonth() + 1).toString().padStart(2, '0')}-${(demande.date as any).getFullYear()}` : '';

        // On vérifie si le terme de recherche est inclus dans le type, le montant, le statut ou la date
        return (demande.type && demande.type.toLowerCase().includes(term)) ||
               (demande.montant_total && demande.montant_total.toString().toLowerCase().includes(term)) ||
               (demande.status && demande.status.toLowerCase().includes(term)) ||
               (dateFormatted.includes(term));
      });
    }
  }
}
