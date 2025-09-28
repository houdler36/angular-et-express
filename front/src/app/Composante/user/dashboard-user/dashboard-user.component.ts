import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { DemandeService } from '../../../services/demande.service';
import { UserService } from '../../../services/user.service';
import { DemandeUpdateService } from '../../../services/demande-update.service';
import { DemandeRecapService } from '../../../services/demande-recap.service';

import { DemandeFormComponent } from '../demande-form/demande-form.component';
import { DemandeListComponent } from '../demande-list/demande-list.component';
import { DemandeRecapComponent } from '../demande-recap/demande-recap.component';
import { RapportdemandeComponent } from '../rapport-demande/rapport-demande.component';

@Component({
  selector: 'app-dashboard-user',
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DemandeFormComponent,
    DemandeListComponent,
    DemandeRecapComponent,
    RapportdemandeComponent
  ]
})
export class DashboardUserComponent implements OnInit, OnDestroy {

  // Stats (existantes)
  totalDemandes = 0;
  demandesEnAttente = 0;
  demandesApprouvees = 0;
  demandesRejetees = 0;

  allDemandes: any[] = [];
  lastDemandes: any[] = [];
  lastThreeDemandes: any[] = [];
  searchTerm = '';
  errorMessage = '';

  // Toggle sections (existantes)
  showAccueil = true;
  showTableauDeBord = false;
  showNewDemandeForm = false;
  showDemandeList = false;
  showDemandeRecap = false;
  showRapportDemande = false;
  showProfile = false;

  // Profil utilisateur (existantes)
  currentUser: any = {};
  profileMessage: string = '';
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // NOUVELLES PROPRIÉTÉS POUR LA PAGE D'ACCUEIL
  recentActivities: any[] = [];

  private updateSubscription!: Subscription;

  constructor(
    private demandeService: DemandeService,
    private userService: UserService,
    private demandeUpdateService: DemandeUpdateService,
    private demandeRecapService: DemandeRecapService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDemandes();
    this.loadDemandesStats();
    this.loadDemandesRecapStats();
    this.loadCurrentUser();
    this.loadRecentActivities(); // NOUVEAU: Charger les activités récentes

    this.updateSubscription = this.demandeUpdateService.demandeUpdated$.subscribe(() => {
      this.loadDemandes();
      this.loadDemandesStats();
      this.loadDemandesRecapStats();
      this.loadRecentActivities(); // NOUVEAU: Recharger les activités aussi
    });
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
  }

  // NOUVELLE MÉTHODE: Calcul de l'efficacité
  calculateEfficiency(): number {
    if (this.totalDemandes === 0) return 0;
    return Math.round((this.demandesApprouvees / this.totalDemandes) * 100);
  }

  // NOUVELLE MÉTHODE: Charger les activités récentes
  loadRecentActivities() {
    // Simulation d'activités récentes basées sur les demandes
    // Vous pouvez adapter cela pour utiliser vos vraies données
    if (this.allDemandes.length > 0) {
      this.recentActivities = this.allDemandes.slice(0, 3).map(demande => {
        let type = 'info';
        let icon = 'fas fa-file-alt';
        let text = '';

        switch(demande.status) {
          case 'Approuvée':
            type = 'success';
            icon = 'fas fa-check-circle';
            text = `Demande #${demande.id} approuvée`;
            break;
          case 'Rejetée':
            type = 'danger';
            icon = 'fas fa-times-circle';
            text = `Demande #${demande.id} rejetée`;
            break;
          case 'En attente':
            type = 'warning';
            icon = 'fas fa-clock';
            text = `Demande #${demande.id} en attente`;
            break;
          default:
            text = `Demande #${demande.id} créée`;
        }

        return {
          type: type,
          icon: icon,
          text: text,
          time: this.getTimeAgo(demande.date)
        };
      });
    } else {
      // Activités par défaut si aucune demande
      this.recentActivities = [
        {
          type: 'info',
          icon: 'fas fa-info-circle',
          text: 'Bienvenue sur votre tableau de bord',
          time: 'Maintenant'
        }
      ];
    }
  }

  // NOUVELLE MÉTHODE: Formater le temps écoulé
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // ------------ Gestion des sections (existantes) ------------
  toggleAccueil(state: boolean) {
    this.showAccueil = state;
    this.showTableauDeBord = false;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
    this.showRapportDemande = false;
    this.showProfile = false;
    if (state) {
      this.loadRecentActivities(); // Recharger les activités quand on revient à l'accueil
    }
  }

  toggleTableauDeBord(state: boolean) {
    this.showTableauDeBord = state;
    this.showAccueil = false;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
    this.showRapportDemande = false;
    this.showProfile = false;
  }

  toggleNewDemandeForm(state: boolean) {
    this.showNewDemandeForm = state;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
    this.showRapportDemande = false;
    this.showProfile = false;
    this.showAccueil = false;
    this.showTableauDeBord = false;
  }

  toggleDemandeList(state: boolean) {
    this.showDemandeList = state;
    this.showNewDemandeForm = false;
    this.showDemandeRecap = false;
    this.showRapportDemande = false;
    this.showProfile = false;
    this.showAccueil = false;
    this.showTableauDeBord = false;
  }

  toggleDemandeRecap(state: boolean) {
    this.showDemandeRecap = state;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
    this.showRapportDemande = false;
    this.showProfile = false;
    this.showAccueil = false;
    this.showTableauDeBord = false;
  }

  toggleRapportDemande(state: boolean) {
    this.showRapportDemande = state;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
    this.showProfile = false;
    this.showAccueil = false;
    this.showTableauDeBord = false;
  }

  toggleProfile(state: boolean) {
    this.showProfile = state;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
    this.showRapportDemande = false;
    this.showAccueil = false;
    this.showTableauDeBord = false;
  }

  // ------------ Chargement des données (existantes) ------------
  loadDemandes() {
    this.demandeService.getAllDemandes().subscribe({
      next: (data: any[]) => {
        this.allDemandes = data
          .map(d => ({ ...d, date: new Date(d.date) }))
          .sort((a, b) => b.id - a.id);

        this.lastDemandes = this.allDemandes;
        this.lastThreeDemandes = this.allDemandes.slice(0, 3);

        if (this.searchTerm) this.applyFilter();
        
        this.loadRecentActivities(); // NOUVEAU: Mettre à jour les activités après chargement
      },
      error: (err) => this.errorMessage = 'Erreur lors du chargement des demandes : ' + err.message
    });
  }

  loadDemandesStats() {
    this.demandeService.getDemandeStats().subscribe({
      next: stats => {
        this.totalDemandes = stats.total;
        this.demandesEnAttente = stats.enAttente;
        this.demandesApprouvees = stats.approuvees;
        this.demandesRejetees = stats.rejetees;
      },
      error: err => this.errorMessage = 'Erreur lors du chargement des stats : ' + (err.error?.message || err.message)
    });
  }

  loadDemandesRecapStats() {
    this.demandeRecapService.getRecapByDemandeType().subscribe({
      next: stats => {},
      error: err => this.errorMessage = 'Erreur lors du chargement du récap : ' + (err.error?.message || err.message)
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.lastDemandes = this.allDemandes;
    } else {
      this.lastDemandes = this.allDemandes.filter(d => {
        const dateFormatted = d.date instanceof Date
          ? `${d.date.getDate().toString().padStart(2,'0')}-${(d.date.getMonth()+1).toString().padStart(2,'0')}-${d.date.getFullYear()}`
          : '';
        return (d.type?.toLowerCase().includes(term) ||
                d.montant_total?.toString().includes(term) ||
                d.status?.toLowerCase().includes(term) ||
                dateFormatted.includes(term));
      });
    }
    this.lastThreeDemandes = this.lastDemandes.slice(0, 3);
  }

  goToDemande(id?: number) {
    if (id != null) this.router.navigate(['/demandes', id]);
  }

  onFormSubmitted() {
    this.showNewDemandeForm = false;
    this.loadDemandes();
    this.loadDemandesStats();
    this.loadDemandesRecapStats();
    this.loadRecentActivities(); // NOUVEAU: Recharger les activités après soumission
  }

  loadCurrentUser() {
    this.userService.getCurrentUser().subscribe({
      next: (user: any) => this.currentUser = { ...user },
      error: (err: any) => this.profileMessage = 'Erreur lors du chargement du profil : ' + err.message
    });
  }

  updateProfile() {
    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.profileMessage = 'Le nouveau mot de passe et la confirmation ne correspondent pas.';
      return;
    }

    const payload: any = {
      username: this.currentUser.username
    };

    if (this.newPassword) {
      payload.currentPassword = this.currentPassword;
      payload.newPassword = this.newPassword;
    }

    this.userService.updateUserProfile(payload).subscribe({
      next: (res: any) => {
        this.profileMessage = res.message || 'Profil mis à jour avec succès';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.loadCurrentUser();
      },
      error: (err: any) => {
        this.profileMessage = 'Erreur lors de la mise à jour : ' + (err.error?.message || err.message);
      }
    });
  }
   scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}