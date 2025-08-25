// src/app/Composante/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core'; // Ajoutez OnInit
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // Importez HttpClientModule
import { UserManagementComponent } from '../user-management/user-management.component';
import { JournalManagementComponent } from '../journal-management/journal-management.component';
import { BudgetManagementComponent } from '../budget-management/budget-management.component';
import { PersonneCrudComponent } from '../personne/personne.component'
import { StatsService } from '../../../services/stats.service'; // Importez le service

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, // Ajoutez HttpClientModule
    UserManagementComponent, 
    JournalManagementComponent, 
    BudgetManagementComponent, 
    PersonneCrudComponent
],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  providers: [StatsService] // Fournissez le service
})
export class AdminDashboardComponent implements OnInit { // Implémentez OnInit
  activePage: string = 'Dashboard';
  
  // Ajoutez les propriétés pour stocker les statistiques
  userCount: number = 0;
  personneCount: number = 0;
  journalCount: number = 0;
  budgetCount: number = 0;
  demandeCount: number = 0;

  // Injectez le StatsService dans le constructeur
  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    // Chargez les statistiques au démarrage du composant
    this.loadDashboardStats();
  }

  setActivePage(page: string) {
    this.activePage = page;
  }

  // Nouvelle méthode pour charger les statistiques
  loadDashboardStats(): void {
    this.statsService.getDashboardStats().subscribe({
        next: (data: any) => {
            // Assurez-vous que les noms des propriétés correspondent à votre réponse JSON
            this.userCount = data.userCount;
            this.personneCount = data.personneCount;
            this.journalCount = data.journalCount;
            this.budgetCount = data.budgetCount;
            this.demandeCount = data.demandeCount;
        },
        error: (err) => {
            console.error('Échec du chargement des statistiques du tableau de bord', err);
        }
    });
}
  
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}