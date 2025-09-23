import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Add RouterModule for the standalone component
import { HttpErrorResponse } from '@angular/common/http';

// Services nécessaires pour les opérations du tableau de bord
import { DemandeService } from '../../services/demande.service';
import { AuthService } from '../../services/auth.service';
import { RapportProjetComponent } from './rapport-projet/rapport-projet.component';

// Interface pour garantir la cohérence des données des validateurs.
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

// Interface pour les statistiques (ajouté pour une vue complète)
export interface StatistiqueDemande {
  total: number;
  enAttente: number;
  finalisees: number;
}


@Component({
  selector: 'app-daf-dashboard',
  standalone: true,
  // Add RouterModule to the imports array for routing to work
  imports: [CommonModule, NgIf, NgFor, CurrencyPipe, RapportProjetComponent, RouterModule],
  templateUrl: './daf-dashboard.component.html',
  styleUrls: ['./daf-dashboard.component.css']
})
export class DafDashboardComponent implements OnInit {
  // L'ID de l'utilisateur DAF actuel.
  currentUserId: number | null = null;
  // Propriété pour stocker les informations de l'utilisateur
  user: any; 

  // Tableaux pour stocker les demandes à traiter, en attente et finalisées.
  demandesATraiter: any[] = [];
  demandesEnAttente: any[] = [];
  demandesFinalisees: any[] = [];
  statistiques: StatistiqueDemande | null = null;

  // Indicateurs de chargement pour l'expérience utilisateur.
  loadingATraiter = false;
  loadingEnAttente = false;
  loadingFinalisees = false;
  loadingStats = false;

  // Page active pour la navigation dans le tableau de bord.
  activePage: string = 'Dashboard';

  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private router: Router
  ) {
    // Récupère l'ID de l'utilisateur après l'authentification.
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    // Récupère les informations de l'utilisateur connecté
    this.user = this.authService.getCurrentUser();
    // Charge toutes les données à l'initialisation du composant.
    this.loadAllDemandes();
  }

  /**
   * Charge les statistiques globales depuis le service.
   */
  loadStats(): void {
    this.loadingStats = true;
    this.demandeService.getDemandeStats().subscribe({
      next: (data) => {
        this.statistiques = data;
        this.loadingStats = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des statistiques :', err);
        this.loadingStats = false;
      }
    });
  }

  // Méthode utilitaire pour recharger toutes les demandes.
  loadAllDemandes() {
    this.loadStats();
    this.loadDemandesATraiter();
    this.loadDemandesEnAttente();
    this.loadDemandesFinalisees();
  }

  // Met à jour la page active.
  setActivePage(page: string) {
    this.activePage = page;
  }
  
  /**
   * Navigue vers le composant de changement de mot de passe.
   * La route est définie dans votre fichier app-routing.module.ts.
   */
  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }

  /**
   * Charge les demandes que le DAF doit valider.
   * Cette méthode appelle l'endpoint backend spécifique au DAF,
   * qui gère le filtrage par montant, pour une meilleure efficacité.
   */
  loadDemandesATraiter() {
    this.loadingATraiter = true;
    this.demandeService.getDemandesDAFAValider().subscribe({
      next: (demandes: any[]) => {
        // La logique de filtrage par montant est gérée par le backend.
        // Le frontend n'a plus qu'à afficher les demandes reçues.
        this.demandesATraiter = demandes;
        this.loadingATraiter = false;
      },
      error: () => this.loadingATraiter = false
    });
  }

  /**
   * Charge les demandes en attente de validation par d'autres.
   */
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
      error: () => this.loadingEnAttente = false
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
   * Valide une demande spécifique.
   * @param id L'identifiant de la demande à valider.
   */
  valider(id: number) {
    this.demandeService.validateDemande(id, 'Validée par le DAF').subscribe({
      next: () => {
        // Si la validation réussit, recharge toutes les listes pour une mise à jour immédiate.
        this.loadAllDemandes();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de la validation de la demande:', error);
      }
    });
  }

  /**
   * Refuse une demande spécifique.
   * @param id L'identifiant de la demande à refuser.
   */
  refuser(id: number) {
    // Assurez-vous d'avoir une méthode dans votre service qui accepte un commentaire si nécessaire.
    this.demandeService.refuseDemande(id, 'Refusée par le DAF').subscribe({
      next: () => {
        // Si le refus réussit, recharge toutes les listes.
        this.loadAllDemandes();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du refus de la demande:', error);
      }
    });
  }

  /**
   * Gère la navigation vers la page de détails d'une demande.
   * @param id L'identifiant de la demande.
   */
  voirDetails(id: number) {
    this.router.navigate(['/demandes', id]);
  }
}