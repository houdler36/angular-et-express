// src/app/auth.guard.ts
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
    // Redirige vers la page de connexion s'il tente d'accéder à une route protégée
    if (!state.url.includes('/login') && !state.url.includes('/register')) {
      router.navigate(['/login']);
      return false;
    }
    // Autorise l'accès aux pages de connexion et d'inscription
    return true;
  }

  // Si l'utilisateur est connecté
  // Bloque l'accès aux pages de connexion et d'inscription
  if (state.url.includes('/login') || state.url.includes('/register')) {
    router.navigate(['/dashboard']);
    return false;
  }
  
  // Vérification de l'accès basé sur le rôle pour la route d'administration
  if (state.url.startsWith('/admin')) {
    const userRole = authService.getUserRole();
    const isUserAdmin = userRole === 'admin';

    // Autorise l'accès si le rôle est 'admin'
    if (isUserAdmin) {
      return true;
    } else {
      // Sinon, redirige vers le tableau de bord utilisateur
      router.navigate(['/dashboard']);
      return false;
    }
  }

  // Autorise l'accès à toutes les autres routes protégées si l'utilisateur est connecté
  return true;
};
