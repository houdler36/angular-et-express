import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
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

export interface RecentActivity {
  id: number;
  type: 'validation' | 'rejet' | 'nouvelle_demande' | 'modification';
  description: string;
  date: Date;
  demandeId?: number;
  user?: string;
  icon?: string;
  text?: string;
  time?: string;
}

@Component({
  selector: 'app-daf-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, RapportProjetComponent, RouterModule, FormsModule],
  templateUrl: './daf-dashboard.component.html',
  styleUrls: ['./daf-dashboard.component.css']
})
export class DafDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private autoRefreshInterval: any;

  // Propriétés utilisateur
  currentUserId: number | null = null;
  user: any;

  // Données brutes des demandes
  rawDemandesATraiter: any[] = [];
  rawDemandesEnAttente: any[] = [];
  rawDemandesFinalisees: any[] = [];

  // Données affichées (après filtre/tri/pagination)
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

  // Tri
  sortKey: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  // Activités récentes
  recentActivities: RecentActivity[] = [];
  loadingActivities = false;

  // Sidebar collapsible
  sidebarCollapsed = false;

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

  // Propriétés pour la compatibilité avec le template admin
  lastUpdate: Date = new Date();

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
    if (!this.user || (this.user.role !== 'daf' && this.user.role !== 'rh')) {
      // Redirect to appropriate dashboard based on role
      if (this.user?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
      return;
    }
    this.loadAllDemandes();
    this.loadRecentActivities();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualisation automatique toutes les 30 secondes
   */
  private setupAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
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
    if (this.user?.role === 'daf') {
      this.loadDemandesATraiter();
    }
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
    if (this.user?.role !== 'daf') {
      this.loadingATraiter = false;
      return;
    }
    this.loadingATraiter = true;
    this.demandeService.getDemandesDAFAValider()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (demandes: any[]) => {
          this.rawDemandesATraiter = demandes.map(demande => {
            const fullName = this.user?.nom && this.user?.prenom ? `${this.user.nom} ${this.user.prenom}` : null;
            const currentValidator = fullName || this.user?.username || null;
            return {
              ...demande,
              currentValidator,
              demandeur: `${demande.responsible_pj?.nom || ''} ${demande.responsible_pj?.prenom || ''}`.trim() || 'Inconnu'
            };
          });
          this.updateDisplayedATraiter();
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
          this.rawDemandesEnAttente = data.map((demande: any) => {
            const validations = demande.validations || [];
            const currentValidation = validations.find((v: any) => v.statut === 'en attente');
            const journalValidator = demande.journal?.journal_validers?.find((v: any) => v.user_id === currentValidation?.user_id);
            const fullName = journalValidator?.user?.nom && journalValidator?.user?.prenom ? `${journalValidator.user.nom} ${journalValidator.user.prenom}` : null;
            const currentValidator = fullName || journalValidator?.user?.username || 'DAF';

            return {
              ...demande,
              currentValidator,
              demandeur: `${demande.responsible_pj?.nom || ''} ${demande.responsible_pj?.prenom || ''}`.trim() || 'Inconnu'
            };
          });
          this.updateDisplayedEnAttente();
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
          this.rawDemandesFinalisees = data.map((demande: any) => {
            const validations = demande.validations || [];
            const finalValidations = validations.filter(
              (v: any) => v.statut === 'validé' || v.statut === 'rejeté'
            );
            const finalValidation = finalValidations.length > 0 ? finalValidations.reduce((prev: any, current: any) => (prev.ordre > current.ordre) ? prev : current) : null;
            const fullName = finalValidation?.user?.nom && finalValidation?.user?.prenom ? `${finalValidation.user.nom} ${finalValidation.user.prenom}` : null;
            const finalValidatorName = fullName || finalValidation?.user?.username || 'Inconnu';

            return {
              ...demande,
              finalValidatorName,
              demandeur: `${demande.responsible_pj?.nom || ''} ${demande.responsible_pj?.prenom || ''}`.trim() || 'Inconnu'
            };
          }).filter((demande: any) => demande.finalValidatorName === currentUserName);
          this.updateDisplayedFinalisees();
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
   * Met à jour les données affichées pour les demandes à traiter
   */
  updateDisplayedATraiter(): void {
    let filtered = this.filterData(this.rawDemandesATraiter);
    let sorted = this.sortData(filtered);
    this.demandesATraiter = this.paginateData(sorted);
    this.totalPages = Math.ceil(sorted.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  /**
   * Met à jour les données affichées pour les demandes en attente
   */
  updateDisplayedEnAttente(): void {
    let filtered = this.filterData(this.rawDemandesEnAttente);
    let sorted = this.sortData(filtered);
    this.demandesEnAttente = this.paginateData(sorted);
    this.totalPages = Math.ceil(sorted.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  /**
   * Met à jour les données affichées pour les demandes finalisées
   */
  updateDisplayedFinalisees(): void {
    let filtered = this.filterData(this.rawDemandesFinalisees);
    let sorted = this.sortData(filtered);
    this.demandesFinalisees = this.paginateData(sorted);
    this.totalPages = Math.ceil(sorted.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  /**
   * Filtre les données
   */
  private filterData(data: any[]): any[] {
    let filtered = data;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(demande =>
        demande.id.toString().includes(term) ||
        demande.type?.toLowerCase().includes(term) ||
        demande.demandeur?.toLowerCase().includes(term) ||
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
   * Tri les données
   */
  private sortData(data: any[]): any[] {
    if (!this.sortKey) return data;

    return data.sort((a, b) => {
      let aVal = a[this.sortKey];
      let bVal = b[this.sortKey];

      // Handle computed fields
      if (this.sortKey === 'demandeur') {
        aVal = a.demandeur || '';
        bVal = b.demandeur || '';
      } else if (this.sortKey === 'currentValidator' && !a.currentValidator) {
        aVal = a.finalValidatorName || '';
        bVal = b.finalValidatorName || '';
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // For dates
      if (this.sortKey === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // For numbers
      if (this.sortKey === 'montant_total' || this.sortKey === 'id') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Pagination des données
   */
  private paginateData(data: any[]): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return data.slice(startIndex, startIndex + this.pageSize);
  }

  /**
   * Gère le tri
   */
  onSort(key: string): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.updateDisplayedForCurrentPage();
  }

  /**
   * Met à jour l'affichage pour la page courante
   */
  private updateDisplayedForCurrentPage(): void {
    switch (this.activePage) {
      case 'demandesATraiter':
        this.updateDisplayedATraiter();
        break;
      case 'demandesEnAttente':
        this.updateDisplayedEnAttente();
        break;
      case 'demandesFinalisees':
        this.updateDisplayedFinalisees();
        break;
    }
  }

  /**
   * Change de page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedForCurrentPage();
    }
  }

  /**
   * Change la taille de page
   */
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.updateDisplayedForCurrentPage();
  }

  /**
   * Gère la recherche et les filtres
   */
  onSearch(): void {
    this.currentPage = 1;
    this.updateDisplayedForCurrentPage();
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

  /**
   * Charge les activités récentes
   */
  loadRecentActivities(): void {
    this.loadingActivities = true;
    // Simuler des données d'activités récentes (à remplacer par un appel API réel)
    this.recentActivities = [
      {
        id: 1,
        type: 'nouvelle_demande',
        description: 'Nouvelle demande d\'achat soumise',
        date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        demandeId: 123,
        user: 'Jean Dupont',
        icon: 'fas fa-plus-circle',
        text: 'Nouvelle demande d\'achat soumise',
        time: 'Il y a 30 min'
      },
      {
        id: 2,
        type: 'validation',
        description: 'Demande validée par le DAF',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        demandeId: 124,
        user: 'Marie Martin',
        icon: 'fas fa-check-circle',
        text: 'Demande validée par le DAF',
        time: 'Il y a 2 h'
      },
      {
        id: 3,
        type: 'rejet',
        description: 'Demande rejetée',
        date: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        demandeId: 125,
        user: 'Pierre Durand',
        icon: 'fas fa-times-circle',
        text: 'Demande rejetée',
        time: 'Il y a 4 h'
      },
      {
        id: 4,
        type: 'modification',
        description: 'Demande modifiée',
        date: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        demandeId: 126,
        user: 'Sophie Leroy',
        icon: 'fas fa-edit',
        text: 'Demande modifiée',
        time: 'Il y a 6 h'
      }
    ];
    this.loadingActivities = false;
  }

  /**
   * Obtient l'icône pour le type d'activité
   */
  getActivityIcon(type: string): string {
    switch (type) {
      case 'validation': return 'fas fa-check-circle';
      case 'rejet': return 'fas fa-times-circle';
      case 'nouvelle_demande': return 'fas fa-plus-circle';
      case 'modification': return 'fas fa-edit';
      default: return 'fas fa-info-circle';
    }
  }

  /**
   * Obtient la classe CSS pour le type d'activité
   */
  getActivityClass(type: string): string {
    switch (type) {
      case 'validation': return 'activity-approved';
      case 'rejet': return 'activity-rejected';
      case 'nouvelle_demande': return 'activity-created';
      case 'modification': return 'activity-updated';
      default: return 'activity-pending';
    }
  }

  /**
   * Formate la date relative
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${days} j`;
  }

  /**
   * Bascule l'état de la sidebar
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getRoleDisplay(role: string): string {
    const roleMap: { [key: string]: string } = {
      'daf': 'DG',
      'user': 'utilisateur',
      'rh': 'valideur',
      'admin': 'admin'
    };
    return roleMap[role] || role;
  }

  /**
   * Scroll to top
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
