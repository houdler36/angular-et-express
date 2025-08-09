// Fichier: src/app/routes.ts
import { Routes } from '@angular/router';

// Composants d'authentification
import { LoginComponent } from './Composante/login/login.component';
import { RegisterComponent } from './Composante/register/register.component';

// Composants utilisateur
import { DashboardUserComponent } from './Composante/user/dashboard-user/dashboard-user.component';
import { DemandeListComponent } from './Composante/user/demande-list/demande-list.component';
import { DemandeFormComponent  } from './Composante/user/demande-form/demande-form.component';
import { DemandeDetailComponent } from './Composante/user/demande-detail/demande-detail.component';

// Composants de rôles spécifiques
import { RhComponent } from './Composante/rh/rh.component';
import { AdminDashboardComponent } from './Composante/admin/admin-dashboard/admin-dashboard.component';
//import { DafDashboardComponent } from './Composante/daf/daf-dashboard/daf-dashboard.component';
//import { CaissierDashboardComponent } from './Composante/caissier/caissier-dashboard/caissier-dashboard.component';

// Importez votre AuthGuardService
import { AuthGuardService } from './auth.guard';

export const routes: Routes = [
  // --- Routes Publiques (accessibles sans connexion) ---
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirige la racine vers la page de connexion

  // --- Routes Protégées (nécessitent une connexion et une vérification de rôle) ---
  {
    path: '', // Ce chemin sert de parent pour toutes les routes protégées
    canActivate: [AuthGuardService], // Applique le garde à l'ensemble du groupe
    children: [
      { path: 'dashboard', component: DashboardUserComponent }, // Tableau de bord de l'utilisateur
      { path: 'admin', component: AdminDashboardComponent }, // Tableau de bord de l'administrateur
      { path: 'rh-dashboard', component: RhComponent },
 //     { path: 'daf-dashboard', component: DafDashboardComponent },
  //    { path: 'caissier-dashboard', component: CaissierDashboardComponent },
      { path: 'demandes', component: DemandeListComponent },
      { path: 'demandes/new', component: DemandeFormComponent },
      { path: 'demandes/edit/:id', component: DemandeFormComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
    ]
  },

  // --- Route Joker (Catch-all) ---
  // Capture toutes les URL non correspondantes et redirige vers la page de connexion
  { path: '**', redirectTo: 'login' }
];
