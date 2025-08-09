//src/app/services/token-storage.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs'; // <--- AJOUTEZ CES IMPORTS

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  // <--- AJOUTEZ CES DEUX LIGNES
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>; // Observable public pour que les composants puissent s'y abonner
  // FIN AJOUT

  constructor() {
    // <--- AJOUTEZ CE BLOC DANS LE CONSTRUCTEUR
    const storedUser = window.sessionStorage.getItem(USER_KEY); // Utilisez sessionStorage ou localStorage de manière cohérente
    this.currentUserSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
    // FIN AJOUT
  }

  signOut(): void {
    console.log("[TokenStorageService] Clearing all session storage.");
    window.sessionStorage.clear(); // Ou window.localStorage.clear();
    this.currentUserSubject.next(null); // <--- ÉMETTEZ NULL LORS DE LA DÉCONNEXION
  }

  public saveToken(token: string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
    console.log("[TokenStorageService] Token saved.");
  }

  public getToken(): string | null {
    return window.sessionStorage.getItem(TOKEN_KEY);
  }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log("[TokenStorageService] User data saved:", user);
    this.currentUserSubject.next(user); // <--- ÉMETTEZ LES NOUVELLES DONNÉES UTILISATEUR
  }

  public getUser(): any {
    // Retourne la dernière valeur émise par le BehaviorSubject
    return this.currentUserSubject.value;
  }

  // <--- AJOUTEZ CETTE MÉTHODE POUR VÉRIFIER L'ÉTAT DE CONNEXION
  public isLoggedIn(): boolean {
    const user = this.getUser();
    // Vérifie si l'objet utilisateur existe et a un accessToken (ou une propriété id/username)
    return !!user && !!user.accessToken;
  }
  // FIN AJOUT
}