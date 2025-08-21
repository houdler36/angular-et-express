import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router'; // Importer le service Router
import { DemandeService } from '../../../services/demande.service';
import { AuthService } from '../../../services/auth.service';

// Interfaces pour la structure des données
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
  templateUrl: './validation-rh.component.html',
  styleUrls: ['./validation-rh.component.css']
})
export class ValidationRhComponent implements OnInit {
  currentUserId: number | null = null;

  demandesATraiter: any[] = [];
  demandesEnAttente: any[] = [];
  demandesFinalisees: any[] = [];

  loadingATraiter = false;
  loadingEnAttente = false;
  loadingFinalisees = false;

  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private router: Router // Injecter le service Router pour la navigation
  ) {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadDemandesATraiter();
    this.loadDemandesEnAttente();
    this.loadDemandesFinalisees();
  }

  /**
   * Charge les demandes que l'utilisateur doit valider.
   */
 loadDemandesATraiter() {
  this.loadingATraiter = true;
  this.demandeService.getDemandesAValider().subscribe({
    next: (demandes: any[]) => {
      this.demandesATraiter = demandes.map(demande => {
        const validationsRH = demande.validations.filter(
          (v: any) => v.user.role === 'rh'
        );

        console.log('Demande à traiter ID:', demande.id);
        console.log('Validations RH:', validationsRH);

        if (validationsRH.length === 0) return null;

        const ordreMinEnAttente = Math.min(
          ...validationsRH
            .filter((v: any) => v.statut === 'en attente')
            .map((v: any) => v.ordre)
        );

        const estTourUtilisateur = validationsRH.some(
          (v: any) => v.user.id === this.currentUserId && v.ordre === ordreMinEnAttente && v.statut === 'en attente'
        );

        const currentValidator = validationsRH.find(
          (v: any) => v.ordre === ordreMinEnAttente && v.statut === 'en attente'
        )?.user.username || null;

        console.log('Ordre minimal en attente:', ordreMinEnAttente);
        console.log('Est tour utilisateur:', estTourUtilisateur);
        console.log('Validateur actuel:', currentValidator);

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

        console.log('Demande en attente ID:', demande.id);
        console.log('Validations:', validations);

        const currentValidation = validations.find(
          (v: any) => v.statut === 'en attente'
        );

        const journalValidator = demande.journal?.journal_validers?.find(
          (v: any) => v.user_id === currentValidation?.user_id
        );

        console.log('Current validation:', currentValidation);
        console.log('Journal validator:', journalValidator);

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

        console.log('Demande finalisée ID:', demande.id);
        console.log('Validations:', validations);

        // Trouver la dernière validation effectuée (approuvée/validée ou rejetée)
        const finalValidation = validations.find(
          (v: any) => v.statut === 'validé' || v.statut === 'rejeté'
        );

        console.log('Final validation trouvée:', finalValidation);

        // Récupérer le nom de l'utilisateur ayant fait cette validation
        const finalValidatorName = finalValidation?.user?.username || 'Inconnu';

        console.log('Final validator:', finalValidatorName);

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

  /**
   * Gère l'action de "Voir" pour une demande spécifique en naviguant vers une nouvelle route.
   * @param id L'identifiant de la demande à visualiser.
   */
  voirDetails(id: number) {
    console.log(`Bouton "Voir" cliqué pour la demande avec l'ID : ${id}`);
    this.router.navigate(['/demandes', id]);
  }
}
