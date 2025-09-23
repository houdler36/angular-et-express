import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Maintenez-les si le composant a d'autres formulaires
import { Router } from '@angular/router';

// Importez le nouveau composant
import { ChangePasswordComponent } from '../../change-password/change-password.component';

import { DemandeService } from '../../../services/demande.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-validation-rh',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    CurrencyPipe,
    ReactiveFormsModule,
    FormsModule,
    ChangePasswordComponent // AJOUTEZ CE COMPOSANT ICI
  ],
  templateUrl: './rh-dashboard.component.html',
  styleUrls: ['./rh-dashboard.component.css']
})
export class RhDashboardComponent implements OnInit {
  currentUserId: number | null = null;
  currentUser: any = null;

  demandesATraiter: any[] = [];
  demandesEnAttente: any[] = [];
  demandesFinalisees: any[] = [];

  loadingATraiter = false;
  loadingEnAttente = false;
  loadingFinalisees = false;
  activePage: string = 'Dashboard';

  // ------------------ Remplaçant RH ------------------
  autresRH: any[] = [];
  selectedDelegueId: number | null = null;
  messageDelegue: string = '';

  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadDemandesATraiter();
    this.loadDemandesEnAttente();
    this.loadDemandesFinalisees();
    this.loadUserProfile();
  }

  // ------------------ Gestion des pages ------------------
  setActivePage(page: string) {
    this.activePage = page;
  }

  // ------------------ Chargement des demandes ------------------
  loadDemandesATraiter() {
    this.loadingATraiter = true;
    this.demandeService.getDemandesAValider().subscribe({
      next: (demandes: any[]) => {
        this.demandesATraiter = demandes.map(demande => {
          const validationsRH = demande.validations.filter((v: any) => v.user.role === 'rh');
          if (validationsRH.length === 0) return null;

          const ordreMinEnAttente = Math.min(
            ...validationsRH.filter((v: any) => v.statut === 'en attente').map((v: any) => v.ordre)
          );

          const estTourUtilisateur = validationsRH.some(
            (v: any) => v.user.id === this.currentUserId && v.ordre === ordreMinEnAttente && v.statut === 'en attente'
          );

          const currentValidator = validationsRH.find(
            (v: any) => v.ordre === ordreMinEnAttente && v.statut === 'en attente'
          )?.user.username || null;

          return {
            ...demande,
            estTourUtilisateur,
            currentValidator
          };
        }).filter(d => d !== null);

        this.loadingATraiter = false;
      },
      error: () => this.loadingATraiter = false
    });
  }

  loadDemandesEnAttente() {
    this.loadingEnAttente = true;
    this.demandeService.getDemandesEnAttenteAutres().subscribe({
      next: (data) => {
        this.demandesEnAttente = data.map((demande: any) => {
          const validations = demande.validations || [];
          const currentValidation = validations.find((v: any) => v.statut === 'en attente');
          const journalValidator = demande.journal?.journal_validers?.find((v: any) => v.user_id === currentValidation?.user_id);

          return {
            ...demande,
            currentValidator: journalValidator?.user?.username || null
          };
        });
        this.loadingEnAttente = false;
      },
      error: () => (this.loadingEnAttente = false)
    });
  }

  loadDemandesFinalisees() {
    this.loadingFinalisees = true;
    this.demandeService.getDemandesFinalisees().subscribe({
      next: (data) => {
        this.demandesFinalisees = data.map((demande: any) => {
          const validations = demande.validations || [];
          const finalValidation = validations.find((v: any) => v.statut === 'validé' || v.statut === 'rejeté');
          const finalValidatorName = finalValidation?.user?.username || 'Inconnu';
          return {
            ...demande,
            finalValidatorName
          };
        });
        this.loadingFinalisees = false;
      },
      error: () => this.loadingFinalisees = false
    });
  }

  // ------------------ Actions sur les demandes ------------------
  valider(id: number) {
    this.demandeService.validateDemande(id).subscribe(() => {
      this.loadDemandesATraiter();
      this.loadDemandesFinalisees();
      this.loadDemandesEnAttente();
    });
  }

  refuser(id: number) {
    this.demandeService.refuseDemande(id, '').subscribe(() => {
      this.loadDemandesATraiter();
      this.loadDemandesFinalisees();
      this.loadDemandesEnAttente();
    });
  }

  voirDetails(id: number) {
    this.router.navigate(['/demandes', id]);
  }

  // ------------------ Mon Profil ------------------
  loadUserProfile() {
    console.log('[loadUserProfile] Début du chargement du profil utilisateur');

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('[loadUserProfile] Profil utilisateur chargé:', user);

        if (user.role === 'rh') {
          this.userService.getRhUsersList().subscribe({
            next: (rhs: any[]) => {
              this.autresRH = rhs.filter(rh => rh.id !== user.id);
              console.log('[loadUserProfile] Liste autres RH:', this.autresRH);

              this.selectedDelegueId = user.delegue_id ? Number(user.delegue_id) : null;
              console.log('[loadUserProfile] Remplaçant actuel (selectedDelegueId):', this.selectedDelegueId);
            },
            error: (err) => {
              console.error('[loadUserProfile] Erreur lors du chargement des autres RH:', err);
              this.autresRH = [];
              this.messageDelegue = "Non autorisé à consulter la liste des RH";
              this.selectedDelegueId = null;
            }
          });
        } else {
          console.log('[loadUserProfile] L’utilisateur n’est pas RH, pas de liste à charger');
          this.autresRH = [];
          this.selectedDelegueId = null;
        }
      },
      error: (err) => {
        console.error('[loadUserProfile] Erreur lors du chargement du profil utilisateur:', err);
        this.currentUser = null;
      }
    });
  }

  // ------------------ Remplaçant RH ------------------
  changerDelegue() {
    this.messageDelegue = '';

    this.userService.setDelegue({ delegue_id: this.selectedDelegueId }).subscribe({
      next: () => this.messageDelegue = 'Remplaçant mis à jour avec succès.',
      error: (err) => this.messageDelegue = err.error?.message || 'Erreur lors de la mise à jour.'
    });
  }
}