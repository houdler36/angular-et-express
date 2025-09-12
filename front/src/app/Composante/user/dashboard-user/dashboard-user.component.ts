// dashboard-user.component.ts
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

  // Stats
  totalDemandes = 0;
  demandesEnAttente = 0;
  demandesApprouvees = 0;
  demandesRejetees = 0;

  allDemandes: any[] = [];
  lastDemandes: any[] = [];
  searchTerm = '';
  errorMessage = '';

  // Toggle sections
  showNewDemandeForm = false;
  showDemandeList = false;
  showDemandeRecap = false;
  showRapportDemande = false;
  showProfile = false;

  // Profil utilisateur
  currentUser: any = {};
  password: string = '';
  profileMessage: string = '';

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

    this.updateSubscription = this.demandeUpdateService.demandeUpdated$.subscribe(() => {
      this.loadDemandes();
      this.loadDemandesStats();
      this.loadDemandesRecapStats();
    });
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
  }

  // ------------ Gestion des sections ------------
  toggleNewDemandeForm(state: boolean) {
    this.showNewDemandeForm = state;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
    this.showRapportDemande = false;
    this.showProfile = false;
  }

  toggleDemandeList(state: boolean) {
    this.showDemandeList = state;
    this.showNewDemandeForm = false;
    this.showDemandeRecap = false;
    this.showRapportDemande = false;
    this.showProfile = false;
  }

  toggleDemandeRecap(state: boolean) {
    this.showDemandeRecap = state;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
    this.showRapportDemande = false;
    this.showProfile = false;
  }

  toggleRapportDemande(state: boolean) {
    this.showRapportDemande = state;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
    this.showProfile = false;
  }

  toggleProfile(state: boolean) {
    this.showProfile = state;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
    this.showRapportDemande = false;
  }

  // ------------ Chargement des données ------------
 loadDemandes() {
  this.demandeService.getAllDemandes().subscribe({
    next: (data: any[]) => {
      // Convertir les dates et trier par ID décroissant
      this.allDemandes = data
        .map(d => ({ ...d, date: new Date(d.date) }))
        .sort((a, b) => b.id - a.id);

      this.lastDemandes = this.allDemandes;
      if (this.searchTerm) this.applyFilter();
    },
    error: (err) => this.errorMessage = 'Erreur lors du chargement des demandes : ' + err.message
  });
}


loadDemandesStats() {
  this.demandeService.getDemandeStats().subscribe({
    next: stats => {
      this.totalDemandes = stats.total;
      this.demandesEnAttente = stats.enAttente;
      this.demandesApprouvees = stats.approuvees; // <-- séparé
      this.demandesRejetees = stats.rejetees;     // <-- séparé
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
  }

  goToDemande(id?: number) {
    if (id != null) this.router.navigate(['/demandes', id]);
  }

  onFormSubmitted() {
    this.showNewDemandeForm = false;
    this.loadDemandes();
    this.loadDemandesStats();
    this.loadDemandesRecapStats();
  }

  // ------------ Profil utilisateur ------------
  loadCurrentUser() {
    this.userService.getCurrentUser().subscribe({
      next: (user: any) => this.currentUser = { ...user },
      error: (err: any) => this.profileMessage = 'Erreur lors du chargement du profil : ' + err.message
    });
  }

currentPassword: string = '';
newPassword: string = '';
confirmPassword: string = '';

updateProfile() {
  // Vérification côté frontend
  if (this.newPassword && this.newPassword !== this.confirmPassword) {
    this.profileMessage = 'Le nouveau mot de passe et la confirmation ne correspondent pas.';
    return;
  }

  const payload: any = {
    username: this.currentUser.username
  };

  // Si l’utilisateur veut changer de mot de passe
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


}
