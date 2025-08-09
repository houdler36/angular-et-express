// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';

  constructor(private http: HttpClient, private tokenStorage: TokenStorageService) { }

  login(username: string, password: string): Observable<any> {
    console.log(`[AuthService] Attempting API login for ${username}`);
    return this.http.post<any>(`${this.apiUrl}/signin`, { username, password }).pipe(
      tap(response => {
        console.log("[AuthService] API login response received.");
      }),
      catchError(this.handleError)
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    console.log(`[AuthService] Attempting API registration for ${username}`);
    return this.http.post<any>(`${this.apiUrl}/signup`, { username, email, password }).pipe(
      tap(response => {
        console.log("[AuthService] API registration response received.");
      }),
      catchError(this.handleError)
    );
  }

  isLoggedIn(): boolean {
    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();
    return !!token && !!user && Object.keys(user).length > 0 && user.id != null;
  }

  // MÉTHODE MISE À JOUR : Récupérer le rôle de l'utilisateur
  getUserRole(): string | null {
    const user = this.tokenStorage.getUser();
    // Nous vérifions si 'user' et 'user.role' existent.
    if (user && user.role) {
      // Le rôle est un string, pas un tableau.
      return user.role.toLowerCase(); // Assurez-vous que le rôle est en minuscules pour la comparaison
    }
    return null;
  }

  logout(): void {
    this.tokenStorage.signOut();
    console.log("[AuthService] User logged out. Storage cleared.");
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur du serveur: ${error.status}\nMessage: ${error.error?.message || error.statusText}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    console.error(`[AuthService] HTTP Error: ${errorMessage}`, error);
    return throwError(() => new Error(errorMessage));
  }
}
