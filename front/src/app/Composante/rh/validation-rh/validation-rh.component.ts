import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-validation-rh',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './validation-rh.component.html',
  styleUrls: ['./validation-rh.component.css']
})
export class ValidationRhComponent implements OnInit {

  demandesAValider: any[] = [];
  demandesFinalisees: any[] = [];
  loadingAValider = false;
  loadingFinalisees = false;
  message = '';
  currentUserId: number | null = null;

  constructor(
    private demandeService: DemandeService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getUserId();
    console.log("ID de l'utilisateur connecté:", this.currentUserId);

    this.loadDemandesAValider();
    this.loadDemandesFinalisees();
  }

  loadDemandesAValider() {
    this.loadingAValider = true;
    this.demandeService.getDemandesAValider().subscribe({
      next: (data: any[]) => {
        console.log("Données reçues de l'API pour les demandes à valider:", data);
        this.demandesAValider = data;
        this.loadingAValider = false;
      },
      error: (err: any) => {
        this.message = err.message;
        this.loadingAValider = false;
        console.error("Erreur lors du chargement des demandes à valider:", err);
      }
    });
  }

  loadDemandesFinalisees() {
    this.loadingFinalisees = true;
    this.demandeService.getDemandesFinalisees().subscribe({
      next: (data: any[]) => {
        this.demandesFinalisees = data;
        this.loadingFinalisees = false;
      },
      error: (err: any) => {
        this.message = err.message;
        this.loadingFinalisees = false;
        console.error("Erreur lors du chargement des demandes finalisées:", err);
      }
    });
  }

  /**
   * Valide une demande.
   * @param demandeId L'ID de la demande à valider.
   */
  valider(demandeId: number) {
    this.demandeService.validateDemande(demandeId).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.loadDemandesAValider();
        this.loadDemandesFinalisees();
      },
      error: (err: any) => {
        this.message = err.message;
        console.error('Erreur de validation:', err);
      }
    });
  }

  /**
   * Refuse une demande.
   * @param demandeId L'ID de la demande à refuser.
   */
  refuser(demandeId: number) {
    const commentaire = prompt('Raison du refus ?') || '';
    if (commentaire) {
      this.demandeService.refuseDemande(demandeId, commentaire).subscribe({
        next: (res: any) => {
          this.message = res.message;
          this.loadDemandesAValider();
          this.loadDemandesFinalisees();
        },
        error: (err: any) => this.message = err.message
      });
    }
  }

  /**
   * Navigue vers la page de détails d'une demande.
   * @param demandeId L'ID de la demande.
   */
  voirDetails(demandeId: number) {
    this.router.navigate(['/demandes', demandeId]);
  }

  /**
   * Vérifie si c'est au tour de l'utilisateur connecté de valider une demande.
   * @param demande La demande à vérifier.
   * @returns Vrai si l'utilisateur est le validateur actuel et que la demande est en attente.
   */
  isMyTurnToValidate(demande: any): boolean {
    // ------------------ LOGS DE DÉBOGAGE ------------------
    console.group(`Vérification pour la demande ID: ${demande.id}`);
    console.log("ID de l'utilisateur connecté (currentUserId):", this.currentUserId);
    console.log("Statut de la demande:", demande.status);
    console.log("Validations dans le journal:", demande.journal?.validations);
    
    // Vérification des conditions initiales
    if (!demande || !demande.journal || !demande.journal.validations || !this.currentUserId) {
      console.log("Condition initiale non remplie (demande, journal, validations ou userId manquants).");
      console.groupEnd();
      return false;
    }
    
    // Trouver la validation correspondante à l'utilisateur actuel
    const validateurActuel = demande.journal.validations.find(
        (v: any) => v.user_id === this.currentUserId
    );

    console.log("Validation correspondante trouvée pour l'utilisateur actuel:", validateurActuel);

    // Vérifier si le validateur existe et si son statut est 'en attente'
    const result = validateurActuel && validateurActuel.statut === 'en attente';
    console.log("Résultat final de la vérification:", result);
    console.groupEnd();

    return result;
  }
}
