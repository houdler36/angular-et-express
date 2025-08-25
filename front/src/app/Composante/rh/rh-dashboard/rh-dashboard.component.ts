import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';

import { DemandeService } from '../../../services/demande.service';
import { AuthService } from '../../../services/auth.service';

// Interfaces pour la structure des données des demandes de validation et des validateurs.
// Ces interfaces garantissent la cohérence des données dans l'application.
interface DemandeValidation {
  id: number;
  demande_id: number;
  user_id: number;
  statut: string;
  ordre: number;
  commentaire?: string;
  signature_image_url?: string;
  date_validation?: Date;
}

interface JournalValidator {
  id: number;
  journal_id: number;
  user_id: number;
  ordre: number;
  statut: string;
  date_validation?: Date;
  commentaire?: string;
  signature_image_url?: string;
  user: {
    id: number;
    username: string;
  };
}

@Component({
  selector: 'app-validation-rh',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, CurrencyPipe],
  templateUrl: './rh-dashboard.component.html',
  styleUrls: ['./rh-dashboard.component.css']
})
export class RhDashboardComponent implements OnInit {
  // L'ID de l'utilisateur actuel, stocké pour les vérifications de validation.
  currentUserId: number | null = null;

  // Tableaux pour stocker les différentes catégories de demandes.
  demandesATraiter: any[] = [];
  demandesEnAttente: any[] = [];
  demandesFinalisees: any[] = [];

  // Indicateurs de chargement pour afficher un message à l'utilisateur pendant que les données se chargent.
  loadingATraiter = false;
  loadingEnAttente = false;
  loadingFinalisees = false;
  activePage: string = 'Dashboard';

  // Le constructeur initialise les services et récupère l'ID de l'utilisateur.
  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private router: Router // Injecte le service Router pour la navigation.
  ) {
    this.currentUserId = this.authService.getUserId();
  }

  // ngOnInit est appelé à l'initialisation du composant. Il déclenche le chargement des données.
  ngOnInit(): void {
    this.loadDemandesATraiter();
    this.loadDemandesEnAttente();
    this.loadDemandesFinalisees();
  }

  // Méthode pour définir la page active et basculer l'affichage.
  setActivePage(page: string) {
    this.activePage = page;
  }

  /**
   * Charge les demandes que l'utilisateur doit valider.
   */
  loadDemandesATraiter() {
    this.loadingATraiter = true;
    this.demandeService.getDemandesAValider().subscribe({
      next: (demandes: any[]) => {
        this.demandesATraiter = demandes.map(demande => {
          // Filtrer les validations pour l'équipe RH.
          const validationsRH = demande.validations.filter(
            (v: any) => v.user.role === 'rh'
          );

          if (validationsRH.length === 0) return null;

          // Trouver l'ordre de la validation la plus ancienne en attente pour les RH.
          const ordreMinEnAttente = Math.min(
            ...validationsRH
              .filter((v: any) => v.statut === 'en attente')
              .map((v: any) => v.ordre)
          );

          // Vérifier si c'est le tour de l'utilisateur actuel.
          const estTourUtilisateur = validationsRH.some(
            (v: any) => v.user.id === this.currentUserId && v.ordre === ordreMinEnAttente && v.statut === 'en attente'
          );

          // Identifier le nom du validateur actuel.
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

  /**
   * Charge les demandes qui sont en attente chez d'autres validateurs.
   */
  loadDemandesEnAttente() {
    this.loadingEnAttente = true;
    this.demandeService.getDemandesEnAttenteAutres().subscribe({
      next: (data) => {
        this.demandesEnAttente = data.map((demande: any) => {
          const validations = demande.validations || [];
          const currentValidation = validations.find(
            (v: any) => v.statut === 'en attente'
          );

          // Associer la validation actuelle au validateur du journal pour obtenir le nom d'utilisateur.
          const journalValidator = demande.journal?.journal_validers?.find(
            (v: any) => v.user_id === currentValidation?.user_id
          );

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

  /**
   * Charge les demandes qui ont été finalisées (approuvées ou rejetées).
   */
  loadDemandesFinalisees() {
    this.loadingFinalisees = true;
    this.demandeService.getDemandesFinalisees().subscribe({
      next: (data) => {
        this.demandesFinalisees = data.map((demande: any) => {
          const validations = demande.validations || [];

          // Trouver la dernière validation pour déterminer le validateur final.
          const finalValidation = validations.find(
            (v: any) => v.statut === 'validé' || v.statut === 'rejeté'
          );

          const finalValidatorName = finalValidation?.user?.username || 'Inconnu';

          return {
            ...demande,
            finalValidatorName
          };
        });

        this.loadingFinalisees = false;
      },
      error: () => {
        console.error('Erreur lors du chargement des demandes finalisées.');
        this.loadingFinalisees = false;
      }
    });
  }

  /**
   * Valide une demande et met à jour les listes.
   * @param id L'identifiant de la demande.
   */
  valider(id: number) {
    this.demandeService.validateDemande(id).subscribe(() => {
      this.loadDemandesATraiter();
      this.loadDemandesFinalisees();
      this.loadDemandesEnAttente();
    });
  }

  /**
   * Refuse une demande et met à jour les listes.
   * @param id L'identifiant de la demande.
   */
  refuser(id: number) {
    this.demandeService.refuseDemande(id, '').subscribe(() => {
      this.loadDemandesATraiter();
      this.loadDemandesFinalisees();
      this.loadDemandesEnAttente();
    });
  }

  /**
   * Gère l'action "Voir" pour une demande en naviguant vers sa page de détails.
   * @param id L'identifiant de la demande.
   */
  voirDetails(id: number) {
    console.log(`Bouton "Voir" cliqué pour la demande avec l'ID : ${id}`);
    this.router.navigate(['/demandes', id]);
  }
}
