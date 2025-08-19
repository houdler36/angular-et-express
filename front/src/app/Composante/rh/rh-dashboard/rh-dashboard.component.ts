import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import ajouté
import { ValidationRhComponent } from '../validation-rh/validation-rh.component';

@Component({
  selector: 'app-rh-dashboard',
  standalone: true,
  imports: [CommonModule, ValidationRhComponent, FormsModule], // FormsModule ajouté
  templateUrl: './rh-dashboard.component.html',
  styleUrls: ['./rh-dashboard.component.css']
})
export class RhDashboardComponent implements OnInit {
  currentView: 'dashboard' | 'validation' = 'dashboard';
  userName = 'Marie Dupont';
  userRole = 'Responsable RH';
  userAvatar = '/assets/images/user-avatar.jpg';
  
  // Propriétés manquantes ajoutées
  selectedYear = 2023;
  selectedPeriod = 'current';
  years = [2023, 2022, 2021];
  
  // Données statistiques
  stats = {
    activeEmployees: 248,
    pendingContracts: 42,
    pendingLeaves: 15,
    satisfactionRate: 94
  };
  
  // Données pour les graphiques
  departments = [
    { name: 'Administration', percentage: 25 },
    { name: 'Médical', percentage: 35 },
    { name: 'Logistique', percentage: 20 },
    { name: 'Finance', percentage: 15 },
    { name: 'Ressources Humaines', percentage: 5 }
  ];
  
  hiringTrends = [
    { month: 'Jan', value: 12 },
    { month: 'Fév', value: 18 },
    { month: 'Mar', value: 15 },
    { month: 'Avr', value: 20 },
    { month: 'Mai', value: 16 },
    { month: 'Juin', value: 22 }
  ];

  ngOnInit(): void {
    setTimeout(() => {
      this.animateStatCards();
    }, 100);
  }

  setCurrentView(view: 'dashboard' | 'validation') {
    this.currentView = view;
  }

  refreshData() {
    this.stats = {
      activeEmployees: Math.floor(Math.random() * 50) + 230,
      pendingContracts: Math.floor(Math.random() * 10) + 35,
      pendingLeaves: Math.floor(Math.random() * 5) + 10,
      satisfactionRate: Math.floor(Math.random() * 5) + 90
    };
    
    this.animateStatCards();
    this.generateRandomData();
  }

  animateStatCards() {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach((card, index) => {
      card.classList.remove('animated');
      setTimeout(() => {
        card.classList.add('animated');
      }, 50 * index);
    });
  }

  generateRandomData() {
    this.departments = this.departments.map(dept => ({
      ...dept,
      percentage: Math.floor(Math.random() * 20) + 10
    }));
    
    const total = this.departments.reduce((sum, dept) => sum + dept.percentage, 0);
    this.departments = this.departments.map(dept => ({
      ...dept,
      percentage: Math.round((dept.percentage / total) * 100)
    }));
    
    this.hiringTrends = this.hiringTrends.map(month => ({
      ...month,
      value: Math.floor(Math.random() * 15) + 10
    }));
  }
}