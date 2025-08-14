import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // indispensable pour *ngIf
import { ValidationRhComponent } from '../validation-rh/validation-rh.component';

@Component({
  selector: 'app-rh-dashboard',
  standalone: true,
  imports: [CommonModule, ValidationRhComponent],
  templateUrl: './rh-dashboard.component.html',
  styleUrls: ['./rh-dashboard.component.css']
})
export class RhDashboardComponent {
  currentView: 'dashboard' | 'validation' = 'dashboard';

  setCurrentView(view: 'dashboard' | 'validation') {
    this.currentView = view;
  }
}
