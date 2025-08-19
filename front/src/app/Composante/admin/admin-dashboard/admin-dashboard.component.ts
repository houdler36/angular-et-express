// src/app/Composante/admin/admin-dashboard/admin-dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementComponent } from '../user-management/user-management.component';
import { JournalManagementComponent } from '../journal-management/journal-management.component';
import { BudgetManagementComponent } from '../budget-management/budget-management.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, UserManagementComponent, JournalManagementComponent, BudgetManagementComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  activePage: string = 'Dashboard';

  setActivePage(page: string) {
    this.activePage = page;
  }
  
  // Méthode pour faire défiler la page vers le haut
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}