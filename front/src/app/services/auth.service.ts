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

  /**
   * Obtient l'ID de l'utilisateur à partir du stockage de jetons.
   * @returns L'ID de l'utilisateur (nombre) ou null si l'utilisateur n'est pas connecté.
   */
  getUserId(): number | null {
    const user = this.tokenStorage.getUser();
    if (user && user.id) {
      return user.id;
    }
    return null;
  }

  /**
   * Obtient le rôle de l'utilisateur connecté.
   * @returns Le rôle de l'utilisateur (chaîne de caractères en minuscules) ou null.
   */
  getUserRole(): string | null {
    const user = this.tokenStorage.getUser();
    if (user && user.role) {
      return user.role.toLowerCase();
    }
    return null;
  }

  logout(): void {
    this.tokenStorage.signOut();
    console.log("[AuthService] User logged out. Storage cleared.");
  }

  /**
   * Gère les erreurs HTTP.
   * @param error L'erreur HTTP à traiter.
   * @returns Un Observable qui lève une erreur.
   */
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
