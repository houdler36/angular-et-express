import { Routes } from '@angular/router';

// Composants d'authentification
import { LoginComponent } from './Composante/login/login.component';
import { RegisterComponent } from './Composante/register/register.component';

// Composants utilisateur
import { DashboardUserComponent } from './Composante/user/dashboard-user/dashboard-user.component';
import { DemandeListComponent } from './Composante/user/demande-list/demande-list.component';
import { DemandeFormComponent } from './Composante/user/demande-form/demande-form.component';
import { DemandeDetailComponent } from './Composante/user/demande-detail/demande-detail.component';
import { DemandeRecapComponent } from './Composante/user/demande-recap/demande-recap.component'; 

// Composants de rôles spécifiques
import { AdminDashboardComponent } from './Composante/admin/admin-dashboard/admin-dashboard.component';
import { DafDashboardComponent } from './Composante/daf/daf-dashboard.component';

// Composants RH
import { RhDashboardComponent } from './Composante/rh/rh-dashboard/rh-dashboard.component';
import { ValidationRhComponent } from './Composante/rh/validation-rh/validation-rh.component';

// Guard
import { AuthGuardService } from './auth.guard';

export const routes: Routes = [
  // Routes publiques
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Routes utilisateur connectés avec des routes enfants pour les vues principales
  { 
    path: 'dashboard', 
    component: DashboardUserComponent, 
    canActivate: [AuthGuardService],
    children: [
      { path: '', redirectTo: 'demandes', pathMatch: 'full' },
      { path: 'demandes', component: DemandeListComponent },
      { path: 'recapitulatif', component: DemandeRecapComponent },
    ]
  },
  
  // Routes spécifiques aux formulaires et détails qui ne sont pas des vues principales
  { path: 'demandes/new', component: DemandeFormComponent, canActivate: [AuthGuardService] },
  { path: 'demandes/edit/:id', component: DemandeFormComponent, canActivate: [AuthGuardService] },
  { path: 'demandes/:id', component: DemandeDetailComponent, canActivate: [AuthGuardService] },

  // Routes Admin
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuardService] },

  // Routes RH
  {
    path: 'rh',
    canActivate: [AuthGuardService],
    children: [
      { path: 'dashboard', component: RhDashboardComponent },
      { path: 'validation', component: ValidationRhComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Routes DAF
  // Routes DAF corrigées
  {
    path: 'daf',
    children: [
      { path: 'dashboard', component: DafDashboardComponent, canActivate: [AuthGuardService] },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },


  // Route joker
  { path: '**', redirectTo: 'login' },
];
