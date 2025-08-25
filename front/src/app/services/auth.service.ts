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

  // ------------------------- LOGIN -------------------------
  login(username: string, password: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/signin`, { username, password }).pipe(
    tap(response => {
      console.log('Login response:', response); // ← AJOUTE ICI
      if (response.accessToken) this.tokenStorage.saveToken(response.accessToken);
      if (response.user) this.tokenStorage.saveUser(response.user);
      console.log('User stored in session:', this.tokenStorage.getUser()); // ← AJOUTE ICI
    }),
    catchError(this.handleError)
  );
}


  // ------------------------- REGISTER -------------------------
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signup`, { username, email, password }).pipe(
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
  getCurrentUser(): any {
    return this.tokenStorage.getUser();
  }

  getUserRole(): string | null {
    const user = this.tokenStorage.getUser();
    return user?.role?.toLowerCase() || null;
  }

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
