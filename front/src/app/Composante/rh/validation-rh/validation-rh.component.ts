import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';
import { AuthService } from '../../../services/auth.service';

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

  constructor(private demandeService: DemandeService, private authService: AuthService) {
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

        if (validationsRH.length === 0) return null;

        // Ordre minimal des validations RH en attente
        const ordreMinEnAttente = Math.min(
          ...validationsRH
            .filter((v: any) => v.statut === 'en attente')
            .map((v: any) => v.ordre)
        );

        // Vérifie si l'utilisateur est dans l'ordre minimal
        const estTourUtilisateur = validationsRH.some(
          (v: any) => v.user.id === this.currentUserId && v.ordre === ordreMinEnAttente && v.statut === 'en attente'
        );

        // Pour afficher le nom du validateur actuel
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
        const validations = demande.validations || []; // Correction clé
        
        const currentValidation = validations.find(
          (v: DemandeValidation) => v.statut === 'en attente'
        );
        
        const journalValidator = demande.journal?.journal_validers?.find(
          (v: JournalValidator) => v.user_id === currentValidation?.user_id
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

loadDemandesFinalisees() {
  this.loadingFinalisees = true;
  this.demandeService.getDemandesFinalisees().subscribe({
    next: (data) => {
      this.demandesFinalisees = data.map((demande: any) => {
        const validations = demande.validations || []; // Correction clé
        
        const finalValidation = validations.find(
          (v: DemandeValidation) => v.statut === 'validé' || v.statut === 'rejeté'
        );
        
        const journalValidator = demande.journal?.journal_validers?.find(
          (v: JournalValidator) => v.user_id === finalValidation?.user_id
        );
        
        return {
          ...demande,
          finalValidator: journalValidator?.user?.username || null
        };
      });
      this.loadingFinalisees = false;
    },
    error: () => (this.loadingFinalisees = false)
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
}