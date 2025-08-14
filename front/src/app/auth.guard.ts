import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from './services/auth.service';

export const AuthGuardService: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifie si l'utilisateur est connecté
  const isUserLoggedIn = authService.isLoggedIn();

  // Si l'utilisateur n'est pas connecté
  if (!isUserLoggedIn) {
    if (!state.url.includes('/login') && !state.url.includes('/register')) {
      router.navigate(['/login']);
      return false;
    }
    return true; // autorise accès à login et register
  }

  // Si l'utilisateur est connecté
  // Bloque accès à login et register
  if (state.url.includes('/login') || state.url.includes('/register')) {
    router.navigate(['/dashboard']);
    return false;
  }

  // Récupère le rôle utilisateur en minuscules
  const userRole = authService.getUserRole();

  // Gestion accès pour admin
  if (state.url.startsWith('/admin')) {
    if (userRole === 'admin') {
      return true;
    } else {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  // Gestion accès pour RH
  if (state.url.startsWith('/rh')) {
    if (userRole === 'rh') {
      return true;
    } else {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  // Autorise toutes les autres routes si connecté
  return true;
};
