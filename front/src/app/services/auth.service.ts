import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TokenStorageService } from './token-storage.service';

// Interface pour les données de la requête de changement de mot de passe
export interface PasswordChangeData {
  currentPassword?: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URLs des APIs, basées sur votre structure back-end
  private authApiUrl = 'http://localhost:8081/api/auth';
  private userApiUrl = 'http://localhost:8081/api/users';

  constructor(private http: HttpClient, private tokenStorage: TokenStorageService) { }

  // ------------------------- LOGIN -------------------------
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authApiUrl}/signin`, { username, password }).pipe(
      tap(response => {
        console.log('Login response:', response);
        if (response.accessToken) {
          this.tokenStorage.saveToken(response.accessToken);
        }
        if (response.user) {
          this.tokenStorage.saveUser(response.user);
        }
        console.log('User stored in session:', this.tokenStorage.getUser());
      }),
      catchError(this.handleError)
    );
  }

  // ------------------------- REGISTER -------------------------
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authApiUrl}/signup`, { username, email, password }).pipe(
      catchError(this.handleError)
    );
  }

  // ------------------------- PASSWORD CHANGE -------------------------
  /**
   * Change le mot de passe de l'utilisateur connecté.
   * La requête est envoyée à l'endpoint /users/me/change-password.
   * @param data L'objet contenant le mot de passe actuel et le nouveau mot de passe.
   */
  changePassword(data: PasswordChangeData): Observable<any> {
    // CORRECTION : L'URL est maintenant alignée sur la route du back-end
    return this.http.put(`${this.userApiUrl}/me/change-password`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Change le mot de passe d'un utilisateur spécifique (pour les administrateurs).
   * La requête est envoyée à l'endpoint /users/:id.
   * @param id L'ID de l'utilisateur à modifier.
   * @param newPassword Le nouveau mot de passe.
   */
  adminChangePassword(id: number, newPassword: string): Observable<any> {
    // Le back-end s'attend à un objet avec le champ 'password'
    return this.http.put(`${this.userApiUrl}/${id}`, { password: newPassword }).pipe(
      catchError(this.handleError)
    );
  }

  // ------------------------- AUTH CHECK -------------------------
  isLoggedIn(): boolean {
    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();
    return !!token && !!user && !!user.role;
  }

  // ------------------------- USER INFO -------------------------
  /**
   * Récupère les informations de l'utilisateur stockées dans le Session Storage.
   * Utile pour afficher le nom d'utilisateur, l'e-mail, etc. dans le tableau de bord.
   */
  getCurrentUser(): any {
    return this.tokenStorage.getUser();
  }

  /**
   * Sauvegarde les informations de l'utilisateur dans le Session Storage.
   * @param user L'objet utilisateur à sauvegarder.
   */
  public saveUser(user: any): void {
    this.tokenStorage.saveUser(user);
  }

  /**
   * Récupère le rôle de l'utilisateur connecté.
   * @returns Le rôle de l'utilisateur en minuscules, ou null s'il n'est pas disponible.
   */
  getUserRole(): string | null {
    const user = this.tokenStorage.getUser();
    return user?.role?.toLowerCase() || null;
  }

  /**
   * Récupère l'ID de l'utilisateur connecté.
   */
  getUserId(): number | null {
    const user = this.tokenStorage.getUser();
    return user?.id || null;
  }

  // ------------------------- LOGOUT -------------------------
  logout(): void {
    this.tokenStorage.signOut();
  }

  // ------------------------- ERROR HANDLER -------------------------
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Erreur serveur ${error.status}: ${error.error?.message || error.statusText}`;
    }
    console.error('[AuthService] ', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}