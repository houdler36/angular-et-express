import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenStorageService } from './services/token-storage.service';

export const AuthGuardService: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const user = tokenStorage.getUser();           // <- récupère directement le user stocké
  const userRole = user?.role?.toLowerCase();

  // Non connecté → redirige vers login
  if (!user) {
    if (!state.url.includes('/login') && !state.url.includes('/register')) {
      router.navigate(['/login']);
      return false;
    }
    return true;
  }

  // Connecté et tente d’aller sur login/register → redirection selon rôle
  if (state.url.includes('/login') || state.url.includes('/register')) {
    if (userRole === 'daf') router.navigate(['/daf/dashboard']);
    else if (userRole === 'rh') router.navigate(['/rh/dashboard']);
    else if (userRole === 'admin') router.navigate(['/admin']);
    else router.navigate(['/dashboard']);
    return false;
  }

  // Gestion des accès par rôle
  if (state.url.includes('/admin')) return userRole === 'admin';
  if (state.url.includes('/rh')) return userRole === 'rh';
  if (state.url.includes('/daf')) return userRole === 'daf';

  // Routes générales accessibles
  return true;
};
