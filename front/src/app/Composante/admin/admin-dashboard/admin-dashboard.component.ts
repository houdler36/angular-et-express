// src/app/Composante/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserManagementComponent } from '../user-management/user-management.component';
import { JournalManagementComponent } from '../journal-management/journal-management.component';
import { BudgetManagementComponent } from '../budget-management/budget-management.component';
import { PersonneCrudComponent } from '../personne/personne.component';
import { StatsService } from '../../../services/stats.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule,
    UserManagementComponent, 
    JournalManagementComponent, 
    BudgetManagementComponent, 
    PersonneCrudComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  providers: [StatsService]
})
export class AdminDashboardComponent implements OnInit {
  activePage: string = 'Dashboard';
  lastUpdate: Date = new Date();
  
  // Propriétés pour les statistiques CRUD
  userCount: number = 0;
  personneCount: number = 0;
  journalCount: number = 0;
  totalBudget: number = 0;
  
  // Activités récentes
  recentActivities = [
    { 
      type: 'success', 
      icon: 'fas fa-user-plus', 
      text: 'Nouvel utilisateur créé: Jean Dupont', 
      time: 'Il y a 5 min' 
    },
    { 
      type: 'info', 
      icon: 'fas fa-user-tie', 
      text: 'Responsable Marie Lambert modifié', 
      time: 'Il y a 15 min' 
    },
    { 
      type: 'warning', 
      icon: 'fas fa-book', 
      text: 'Nouvelle entrée dans le journal des transactions', 
      time: 'Il y a 1 heure' 
    },
    { 
      type: 'info', 
      icon: 'fas fa-wallet', 
      text: 'Budget du projet santé mis à jour', 
      time: 'Il y a 2 heures' 
    },
    { 
      type: 'success', 
      icon: 'fas fa-users', 
      text: '3 nouveaux utilisateurs ajoutés', 
      time: 'Il y a 3 heures' 
    }
  ];

  constructor(private statsService: StatsService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      // Redirect to appropriate dashboard based on role
      if (user?.role === 'daf') {
        this.router.navigate(['/daf/dashboard']);
      } else if (user?.role === 'rh') {
        this.router.navigate(['/rh/dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
      return;
    }
    this.loadDashboardStats();
    this.startAutoRefresh();
  }

  setActivePage(page: string) {
    this.activePage = page;
  }

  loadDashboardStats(): void {
    this.statsService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.userCount = data.userCount || 0;
        this.personneCount = data.personneCount || 0;
        this.journalCount = data.journalCount || 0;
        this.totalBudget = data.totalBudget || 0;
        this.lastUpdate = new Date();
      },
      error: (err) => {
        console.error('Échec du chargement des statistiques du tableau de bord', err);
      }
    });
  }

  startAutoRefresh(): void {
    // Actualiser les données toutes les 5 minutes
    setInterval(() => {
      this.loadDashboardStats();
    }, 300000);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}