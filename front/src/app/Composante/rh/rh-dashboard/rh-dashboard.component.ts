import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValidationRhComponent } from '../validation-rh/validation-rh.component';

@Component({
  selector: 'app-rh-dashboard',
  standalone: true,
  imports: [CommonModule, ValidationRhComponent, FormsModule],
  templateUrl: './rh-dashboard.component.html',
  styleUrls: ['./rh-dashboard.component.css']
})
export class RhDashboardComponent implements OnInit {
  // La vue par défaut est la vue de validation pour un validateur
  currentView: 'dashboard' | 'validation' = 'validation'; 

  ngOnInit(): void {
    // Logique de chargement des données de validation
  }

  // La méthode setCurrentView reste la même si vous souhaitez conserver la navigation
  setCurrentView(view: 'dashboard' | 'validation') {
    this.currentView = view;
  }

}