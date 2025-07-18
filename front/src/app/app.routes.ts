import { Routes } from '@angular/router';
import { LoginComponent } from './Composante/login/login.component';
import { RhComponent } from './Composante/rh/rh.component';
import { Test } from './test/test';
import { RegisterComponent } from './Composante/register/register.component';
export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { path: 'register', 
    component: RegisterComponent },
  { 
    path: 'rh', 
    component: RhComponent 
  },
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  },
  { path: 'test', component: Test },
];