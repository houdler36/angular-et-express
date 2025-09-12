import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { DemandeService } from '../../../services/demande.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-validation-rh',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, CurrencyPipe, ReactiveFormsModule, FormsModule],
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

  // ------------------ Mon Profil ------------------
  profilForm: FormGroup;
  messageSuccess: string = '';
  messageError: string = '';

  // ------------------ Changement de signature ------------------
  selectedFile: File | null = null;
  messageSignature: string = '';

  // ------------------ Remplaçant RH ------------------
  autresRH: any[] = [];
  selectedDelegueId: number | null = null;
  messageDelegue: string = '';

  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.currentUserId = this.authService.getUserId();

    this.profilForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
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

      // Charger les autres RH pour le remplaçant uniquement si role RH
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
            // Fallback : afficher message et désactiver le <select>
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




  changerMotDePasse() {
    this.messageSuccess = '';
    this.messageError = '';

    const { currentPassword, newPassword, confirmPassword } = this.profilForm.value;

    if (newPassword !== confirmPassword) {
      this.messageError = 'Le nouveau mot de passe et sa confirmation ne correspondent pas.';
      return;
    }

    const updateData = { currentPassword, newPassword };

    this.userService.updateUserProfile(updateData).subscribe({
      next: () => {
        this.messageSuccess = 'Mot de passe modifié avec succès !';
        this.profilForm.reset();
      },
      error: (err) => {
        console.error(err);
        this.messageError = err.error?.message || 'Erreur lors de la modification du mot de passe.';
      }
    });
  }

  // ------------------ Changement de signature ------------------
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  changerSignature() {
    if (!this.selectedFile) {
      this.messageSignature = 'Veuillez sélectionner un fichier.';
      return;
    }

    this.userService.uploadSignature(this.selectedFile).subscribe({
      next: () => {
        this.messageSignature = 'Signature mise à jour avec succès !';
        this.selectedFile = null;
      },
      error: (err) => {
        console.error(err);
        this.messageSignature = err.error?.message || 'Erreur lors de la mise à jour de la signature.';
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
