import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

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
    NgClass,
    CurrencyPipe,
    ReactiveFormsModule,
    FormsModule,
    ChangePasswordComponent,
    BaseChartDirective
  ],
  templateUrl: './rh-dashboard.component.html',
  styleUrls: ['./rh-dashboard.component.css']
})
export class RhDashboardComponent implements OnInit {
  currentUserId: number | null = null;
  currentUser: any = null;
  currentDate: Date = new Date();

  demandesATraiter: any[] = [];
  demandesEnAttente: any[] = [];
  demandesFinalisees: any[] = [];

  // Arrays filtrés pour l'affichage
  filteredDemandesATraiter: any[] = [];
  filteredDemandesEnAttente: any[] = [];
  filteredDemandesFinalisees: any[] = [];

  loadingATraiter = false;
  loadingEnAttente = false;
  loadingFinalisees = false;
  activePage: string = 'Accueil';

  // ------------------ Remplaçant RH ------------------
  autresRH: any[] = [];
  selectedDelegueId: number | null = null;
  messageDelegue: string = '';

  // ------------------ Nouvelles variables pour l'accueil ------------------
  recentActivities: any[] = [];
  averageProcessingTime: number = 2;
  evolutionRate: number = 12;

  // ------------------ Filtres et recherche ------------------
  searchTerm: string = '';
  filters: any = {
    type: '',
    statut: '',
    dateDebut: '',
    dateFin: ''
  };

  // ------------------ Graphiques ------------------
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      x: {},
      y: {
        beginAtZero: true
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartData: ChartData<'bar'> = {
    labels: ['À traiter', 'En attente', 'Finalisées'],
    datasets: [
      {
        data: [0, 0, 0],
        label: 'Demandes',
        backgroundColor: ['#f59e0b', '#6366f1', '#10b981'],
        borderColor: ['#d97706', '#4f46e5', '#059669'],
        borderWidth: 1
      }
    ]
  };

  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || this.currentUser.role !== 'rh') {
      // Redirect to appropriate dashboard based on role
      if (this.currentUser?.role === 'daf') {
        this.router.navigate(['/daf/dashboard']);
      } else if (this.currentUser?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
      return;
    }
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

          const fullName = this.currentUser?.nom && this.currentUser?.prenom ? `${this.currentUser.nom} ${this.currentUser.prenom}` : null;
          const currentValidator = fullName || this.currentUser?.username || null;

          return {
            ...demande,
            estTourUtilisateur,
            currentValidator
          };
        }).filter(d => d !== null);

        this.filteredDemandesATraiter = [...this.demandesATraiter];
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

          const fullName = currentValidation?.user?.nom && currentValidation?.user?.prenom ? `${currentValidation.user.nom} ${currentValidation.user.prenom}` : null;
          const currentValidator = fullName || currentValidation?.user?.username || 'RH';

          return {
            ...demande,
            currentValidator
          };
        });
        this.filteredDemandesEnAttente = [...this.demandesEnAttente];
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
          // Find the validation with the highest ordre that is 'validé' or 'rejeté'
          const finalValidations = validations.filter((v: any) => v.statut === 'validé' || v.statut === 'rejeté');
          let finalValidatorName = 'Inconnu';
          if (finalValidations.length > 0) {
            const finalValidation = finalValidations.reduce((max: any, current: any) => (current.ordre > max.ordre ? current : max), finalValidations[0]);
            finalValidatorName = finalValidation?.user?.username || 'Inconnu';
          }
          return {
            ...demande,
            finalValidatorName
          };
        });
        this.filteredDemandesFinalisees = [...this.demandesFinalisees];
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
      this.loadRecentActivities();
    });
  }

  refuser(id: number) {
    this.demandeService.refuseDemande(id, '').subscribe(() => {
      this.loadDemandesATraiter();
      this.loadDemandesFinalisees();
      this.loadDemandesEnAttente();
      this.loadRecentActivities();
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

        this.loadDemandesATraiter();
        this.loadDemandesEnAttente();
        this.loadDemandesFinalisees();
        this.loadRecentActivities();

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
          console.log('[loadUserProfile] Lutilisateur nest pas RH, pas de liste à charger');
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
      next: () => {
        this.messageDelegue = 'Remplaçant mis à jour avec succès.';
        this.addActivity('success', 'Remplaçant RH mis à jour', 'fas fa-user-check');
      },
      error: (err) => this.messageDelegue = err.error?.message || 'Erreur lors de la mise à jour.'
    });
  }

  // ------------------ Nouvelles méthodes pour l'accueil ------------------
  loadRecentActivities() {
    // Simulation d'activités récentes - À remplacer par un appel API réel
    this.recentActivities = [
      {
        type: 'validation',
        icon: 'fas fa-check-circle',
        message: 'Vous avez validé la demande #2456',
        time: 'Il y a 2 heures'
      },
      {
        type: 'rejet',
        icon: 'fas fa-times-circle',
        message: 'Vous avez rejeté la demande #2451',
        time: 'Il y a 5 heures'
      },
      {
        type: 'info',
        icon: 'fas fa-info-circle',
        message: 'Nouvelle demande #2458 reçue',
        time: 'Il y a 1 jour'
      },
      {
        type: 'success',
        icon: 'fas fa-chart-line',
        message: 'Taux de traitement amélioré de 15% ce mois',
        time: 'Il y a 2 jours'
      }
    ];
  }

  addActivity(type: string, message: string, icon: string) {
    const newActivity = {
      type,
      icon,
      message,
      time: 'À l\'instant'
    };
    this.recentActivities.unshift(newActivity);
    
    // Garder seulement les 10 dernières activités
    if (this.recentActivities.length > 10) {
      this.recentActivities = this.recentActivities.slice(0, 10);
    }
  }

  getEfficiencyRate(): number {
    const total = this.demandesFinalisees.length + this.demandesEnAttente.length + this.demandesATraiter.length;
    if (total === 0) return 0;
    return Math.round((this.demandesFinalisees.length / total) * 100);
  }

  // Méthode pour rafraîchir toutes les données
  refreshAllData() {
    this.loadDemandesATraiter();
    this.loadDemandesEnAttente();
    this.loadDemandesFinalisees();
    this.loadRecentActivities();
    this.updateChartData();
  }

  // ------------------ Filtres et recherche ------------------
  onSearch() {
    // Appliquer les filtres et recherche côté client
    this.applyFilters();
  }

  applyFilters() {
    // Fonction pour appliquer les filtres à un tableau
    const filterArray = (array: any[]) => {
      return array.filter(demande => {
        // Filtre par terme de recherche
        if (this.searchTerm) {
          const searchLower = this.searchTerm.toLowerCase();
          const demandeur = `${demande.responsible_pj?.nom || ''} ${demande.responsible_pj?.prenom || ''}`.toLowerCase();
          const description = (demande.description || '').toLowerCase();
          const type = (demande.type || '').toLowerCase();
          if (!demandeur.includes(searchLower) && !description.includes(searchLower) && !type.includes(searchLower)) {
            return false;
          }
        }

        // Filtre par type
        if (this.filters.type && demande.type !== this.filters.type) {
          return false;
        }

        // Filtre par statut
        if (this.filters.statut && demande.status !== this.filters.statut) {
          return false;
        }

        // Filtre par dates
        if (this.filters.dateDebut || this.filters.dateFin) {
          const demandeDate = new Date(demande.date);
          if (this.filters.dateDebut) {
            const dateDebut = new Date(this.filters.dateDebut);
            if (demandeDate < dateDebut) return false;
          }
          if (this.filters.dateFin) {
            const dateFin = new Date(this.filters.dateFin);
            if (demandeDate > dateFin) return false;
          }
        }

        return true;
      });
    };

    // Appliquer les filtres à chaque tableau
    this.filteredDemandesATraiter = filterArray(this.demandesATraiter);
    this.filteredDemandesEnAttente = filterArray(this.demandesEnAttente);
    this.filteredDemandesFinalisees = filterArray(this.demandesFinalisees);
  }

  resetFilters() {
    this.searchTerm = '';
    this.filters = {
      type: '',
      statut: '',
      dateDebut: '',
      dateFin: ''
    };
    this.onSearch();
  }

  // ------------------ Export CSV ------------------
  exportToCSV() {
    const data = [
      ...this.filteredDemandesATraiter.map(d => ({ ...d, categorie: 'À traiter' })),
      ...this.filteredDemandesEnAttente.map(d => ({ ...d, categorie: 'En attente' })),
      ...this.filteredDemandesFinalisees.map(d => ({ ...d, categorie: 'Finalisées' }))
    ];

    if (data.length === 0) {
      alert('Aucune donnée à exporter.');
      return;
    }

    const headers = ['ID', 'Type', 'Demandeur', 'Motif', 'Montant Total', 'Statut', 'Date', 'Catégorie'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        row.type,
        `"${row.responsible_pj?.nom} ${row.responsible_pj?.prenom}"`,
        `"${row.description || ''}"`,
        row.montant_total,
        row.status,
        row.date,
        row.categorie
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `demandes_rh_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ------------------ Mise à jour des graphiques ------------------
  updateChartData() {
    this.barChartData = {
      ...this.barChartData,
      datasets: [{
        ...this.barChartData.datasets[0],
        data: [
          this.demandesATraiter.length,
          this.demandesEnAttente.length,
          this.demandesFinalisees.length
        ]
      }]
    };
  }

  // ------------------ Mode sombre ------------------
  isDarkMode: boolean = false;

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const body = document.body;
    if (this.isDarkMode) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  }
}
