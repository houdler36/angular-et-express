import { Routes } from '@angular/router';

// Composants d'authentification
import { LoginComponent } from './Composante/login/login.component';
import { RegisterComponent } from './Composante/register/register.component';

// Composants utilisateur
import { DashboardUserComponent } from './Composante/user/dashboard-user/dashboard-user.component';
import { DemandeListComponent } from './Composante/user/demande-list/demande-list.component';
import { DemandeFormComponent } from './Composante/user/demande-form/demande-form.component';
import { DemandeDetailComponent } from './Composante/user/demande-detail/demande-detail.component';

// Composants de rôles spécifiques
import { AdminDashboardComponent } from './Composante/admin/admin-dashboard/admin-dashboard.component';

// Composants RH
import { RhDashboardComponent } from './Composante/rh/rh-dashboard/rh-dashboard.component';
import { ValidationRhComponent } from './Composante/rh/validation-rh/validation-rh.component';

// Service de garde d’authentification
import { AuthGuardService } from './auth.guard';

export const routes: Routes = [
  // Routes publiques accessibles sans authentification
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Routes protégées (nécessitent authentification)
  {
    path: '',
    canActivate: [AuthGuardService],
    children: [
      { path: 'dashboard', component: DashboardUserComponent },
      { path: 'admin', component: AdminDashboardComponent },

      // Sous-routes RH, sécurisées avec canActivate aussi
      {
        path: 'rh',
        canActivate: [AuthGuardService],
        children: [
          { path: 'dashboard', component: RhDashboardComponent },
          { path: 'validation', component: ValidationRhComponent },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },

      { path: 'demandes', component: DemandeListComponent },
      { path: 'demandes/new', component: DemandeFormComponent },
      { path: 'demandes/edit/:id', component: DemandeFormComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
    ],
  },

  // Route joker pour toutes les autres URL non reconnues
  { path: '**', redirectTo: 'login' },
];
