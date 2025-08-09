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
  // Le templateUrl est corrigé pour pointer vers le bon fichier HTML
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  // L'état de la page active est géré ici
  activePage: string = 'Dashboard';

  setActivePage(page: string) {
    this.activePage = page;
  }
}