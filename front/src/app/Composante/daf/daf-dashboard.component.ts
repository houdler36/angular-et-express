import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);
// Services
import { DemandeService } from '../../services/demande.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RapportProjetComponent } from './rapport-projet/rapport-projet.component';

// Interfaces
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

export interface StatistiqueDemande {
  total: number;
  enAttente: number;
  finalisees: number;
  demandeATraiter: number;
}

@Component({
  selector: 'app-daf-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, CurrencyPipe, RapportProjetComponent, RouterModule, FormsModule, BaseChartDirective],
  templateUrl: './daf-dashboard.component.html',
  styleUrls: ['./daf-dashboard.component.css']
})
export class DafDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Propriétés utilisateur
  currentUserId: number | null = null;
  user: any;
  
  // Données des demandes
  demandesATraiter: any[] = [];
  demandesEnAttente: any[] = [];
  demandesFinalisees: any[] = [];
  statistiques: StatistiqueDemande | null = null;

  // États de chargement
  loadingATraiter = false;
  loadingEnAttente = false;
  loadingFinalisees = false;
  loadingStats = false;

  // Navigation
  activePage: string = 'Dashboard';
  searchTerm: string = '';

  // Filtres
  filters = {
    type: '',
    statut: '',
    dateDebut: '',
    dateFin: ''
  };

  // Données du graphique
  public barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Statistiques des demandes'
      }
    }
  };

  public barChartLabels = ['À traiter', 'En attente', 'Finalisées'];
  public barChartType = 'bar' as const;
  public barChartLegend = true;
  public barChartData = {
    labels: this.barChartLabels,
    datasets: [
      {
        data: [0, 0, 0],
        label: 'Demandes',
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(59, 130, 246)'
        ],
        borderWidth: 1
      }
    ]
  };

  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user || this.user.role !== 'daf') {
      // Redirect to appropriate dashboard based on role
      if (this.user?.role === 'rh') {
        this.router.navigate(['/rh/dashboard']);
      } else if (this.user?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
      return;
    }
    this.loadAllDemandes();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualisation automatique toutes les 30 secondes
   */
  private setupAutoRefresh(): void {
    setInterval(() => {
      if (this.activePage === 'Dashboard' || this.activePage === 'demandesATraiter') {
        this.loadAllDemandes();
      }
    }, 30000);
  }

  /**
   * Charge toutes les données du dashboard
   */
  loadAllDemandes(): void {
    this.loadStats();
    this.loadDemandesATraiter();
    this.loadDemandesEnAttente();
    this.loadDemandesFinalisees();
  }

  /**
   * Charge les statistiques
   */
  loadStats(): void {
    this.loadingStats = true;
    this.demandeService.getDemandeStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.statistiques = data;
          this.updateChartData();
          this.loadingStats = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors du chargement des statistiques :', err);
          this.notificationService.showError('Erreur lors du chargement des statistiques');
          this.loadingStats = false;
        }
      });
  }

  /**
   * Met à jour les données du graphique
   */
  private updateChartData(): void {
    if (this.statistiques) {
      this.barChartData = {
        ...this.barChartData,
        datasets: [{
          ...this.barChartData.datasets[0],
          data: [
            this.statistiques.demandeATraiter,
            this.statistiques.enAttente,
            this.statistiques.finalisees
          ]
        }]
      };
    }
  }

  /**
   * Charge les demandes à traiter
   */
  loadDemandesATraiter(): void {
    this.loadingATraiter = true;
    this.demandeService.getDemandesDAFAValider()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (demandes: any[]) => {
          this.demandesATraiter = this.applyFilters(demandes.map(demande => {
            const fullName = this.user?.nom && this.user?.prenom ? `${this.user.nom} ${this.user.prenom}` : null;
            const currentValidator = fullName || this.user?.username || null;
            return {
              ...demande,
              currentValidator
            };
          }));
          this.loadingATraiter = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des demandes à traiter:', err);
          this.notificationService.showError('Erreur lors du chargement des demandes à traiter');
          this.loadingATraiter = false;
        }
      });
  }

  /**
   * Charge les demandes en attente
   */
  loadDemandesEnAttente(): void {
    this.loadingEnAttente = true;
    this.demandeService.getDemandesEnAttenteAutres()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.demandesEnAttente = this.applyFilters(data.map((demande: any) => {
            const validations = demande.validations || [];
            const currentValidation = validations.find((v: any) => v.statut === 'en attente');
            const journalValidator = demande.journal?.journal_validers?.find((v: any) => v.user_id === currentValidation?.user_id);
            const fullName = journalValidator?.user?.nom && journalValidator?.user?.prenom ? `${journalValidator.user.nom} ${journalValidator.user.prenom}` : null;
            const currentValidator = fullName || journalValidator?.user?.username || 'DAF';

            return {
              ...demande,
              currentValidator
            };
          }));
          this.loadingEnAttente = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des demandes en attente:', err);
          this.notificationService.showError('Erreur lors du chargement des demandes en attente');
          this.loadingEnAttente = false;
        }
      });
  }

  /**
   * Charge les demandes finalisées
   */
  loadDemandesFinalisees(): void {
    this.loadingFinalisees = true;
    this.demandeService.getDemandesFinalisees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const currentUserFullName = this.user?.nom && this.user?.prenom ? `${this.user.nom} ${this.user.prenom}` : null;
          const currentUserName = currentUserFullName || this.user?.username;
          this.demandesFinalisees = this.applyFilters(data.map((demande: any) => {
            const validations = demande.validations || [];
            const finalValidations = validations.filter(
              (v: any) => v.statut === 'validé' || v.statut === 'rejeté'
            );
            const finalValidation = finalValidations.length > 0 ? finalValidations.reduce((prev: any, current: any) => (prev.ordre > current.ordre) ? prev : current) : null;
            const fullName = finalValidation?.user?.nom && finalValidation?.user?.prenom ? `${finalValidation.user.nom} ${finalValidation.user.prenom}` : null;
            const finalValidatorName = fullName || finalValidation?.user?.username || 'Inconnu';

            return {
              ...demande,
              finalValidatorName
            };
          }).filter((demande: any) => demande.finalValidatorName === currentUserName));
          this.loadingFinalisees = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des demandes finalisées:', err);
          this.notificationService.showError('Erreur lors du chargement des demandes finalisées');
          this.loadingFinalisees = false;
        }
      });
  }

  /**
   * Applique les filtres de recherche
   */
  applyFilters(demandes: any[]): any[] {
    let filtered = demandes;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(demande => 
        demande.id.toString().includes(term) ||
        demande.type?.toLowerCase().includes(term) ||
        demande.responsible_pj?.nom?.toLowerCase().includes(term) ||
        demande.responsible_pj?.prenom?.toLowerCase().includes(term) ||
        demande.description?.toLowerCase().includes(term)
      );
    }

    if (this.filters.type) {
      filtered = filtered.filter(demande => demande.type === this.filters.type);
    }

    if (this.filters.statut) {
      filtered = filtered.filter(demande => demande.status === this.filters.statut);
    }

    if (this.filters.dateDebut) {
      filtered = filtered.filter(demande => 
        new Date(demande.date) >= new Date(this.filters.dateDebut)
      );
    }

    if (this.filters.dateFin) {
      filtered = filtered.filter(demande => 
        new Date(demande.date) <= new Date(this.filters.dateFin)
      );
    }

    return filtered;
  }

  /**
   * Gère la recherche
   */
  onSearch(): void {
    switch (this.activePage) {
      case 'demandesATraiter':
        this.loadDemandesATraiter();
        break;
      case 'demandesEnAttente':
        this.loadDemandesEnAttente();
        break;
      case 'demandesFinalisees':
        this.loadDemandesFinalisees();
        break;
    }
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.filters = {
      type: '',
      statut: '',
      dateDebut: '',
      dateFin: ''
    };
    this.loadAllDemandes();
  }

  /**
   * Valide une demande
   */
  valider(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir valider cette demande ?')) {
      this.demandeService.validateDemande(id, 'Validée par le DAF')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Demande validée avec succès');
            this.loadAllDemandes();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Erreur lors de la validation de la demande:', error);
            this.notificationService.showError('Erreur lors de la validation de la demande');
          }
        });
    }
  }

  /**
   * Refuse une demande
   */
  refuser(id: number): void {
    const commentaire = prompt('Veuillez saisir le motif du refus :');
    if (commentaire) {
      this.demandeService.refuseDemande(id, commentaire)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Demande refusée avec succès');
            this.loadAllDemandes();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Erreur lors du refus de la demande:', error);
            this.notificationService.showError('Erreur lors du refus de la demande');
          }
        });
    }
  }

  /**
   * Exporte les données en CSV
   */
  exportToCSV(): void {
    let dataToExport: any[] = [];
    let filename = '';

    switch (this.activePage) {
      case 'demandesATraiter':
        dataToExport = this.demandesATraiter;
        filename = 'demandes_a_traiter.csv';
        break;
      case 'demandesEnAttente':
        dataToExport = this.demandesEnAttente;
        filename = 'demandes_en_attente.csv';
        break;
      case 'demandesFinalisees':
        dataToExport = this.demandesFinalisees;
        filename = 'demandes_finalisees.csv';
        break;
      default:
        return;
    }

    if (dataToExport.length === 0) {
      this.notificationService.showWarning('Aucune donnée à exporter');
      return;
    }

    this.demandeService.exportToCSV(dataToExport, filename);
  }

  /**
   * Navigation
   */
  setActivePage(page: string): void {
    this.activePage = page;
    this.resetFilters();
  }

  /**
   * Voir les détails d'une demande
   */
  voirDetails(id: number): void {
    this.router.navigate(['/demandes', id]);
  }

  /**
   * Changer le mot de passe
   */
  goToChangePassword(): void {
    this.router.navigate(['/change-password']);
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Calcule le temps écoulé depuis la création
   */
  getTimeElapsed(date: string): string {
    const now = new Date();
    const created = new Date(date);
    const diff = now.getTime() - created.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Il y a 1 jour";
    return `Il y a ${days} jours`;
  }
}