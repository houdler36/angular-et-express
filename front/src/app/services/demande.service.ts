import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class DemandeService {
  private apiUrl = 'http://localhost:8081/api/demandes';
  private apiUtilsUrl = 'http://localhost:8081/api/utils';
  private apiPersonnesUrl = 'http://localhost:8081/api/personnes';

  constructor(
    private http: HttpClient,
    private tokenStorageService: TokenStorageService
  ) { }

  getAuthHeaders(): HttpHeaders {
    const user = this.tokenStorageService.getUser();
    const token = user?.accessToken;
    if (token) {
      return new HttpHeaders({ 'x-access-token': token });
    }
    return new HttpHeaders();
  }

  /**
   * Gère les erreurs HTTP de manière plus robuste.
   * @param error L'erreur HTTP à traiter.
   * @returns Un Observable qui lève une erreur.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau.
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      // Le backend a renvoyé un code de réponse infructueux.
      // Le corps de la réponse peut contenir des informations utiles.
      const serverError = error.error as { message?: string } || {};
      if (serverError.message) {
        errorMessage = `Erreur du serveur: ${serverError.message}`;
      } else {
        errorMessage = `Erreur serveur - Code: ${error.status}, Message: ${error.statusText}`;
      }
    }
    console.error('Détails de l\'erreur:', error);
    return throwError(() => new Error(errorMessage));
  }

  createDemande(demande: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, demande, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getAllDemandes(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(this.apiUrl, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getDemandeById(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateDemande(id: number, demande: Partial<any>): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}`, demande, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteDemande(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getDemandesAValider(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/avalider`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getDemandesFinalisees(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/finalisees`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ⭐ FONCTION DE VALIDATION MISE À JOUR ⭐
  // Prend un commentaire en paramètre pour plus de flexibilité
  validateDemande(demandeId: number, commentaire: string = ''): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${demandeId}/valider`, { commentaire }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ⭐ FONCTION DE REFUS MISE À JOUR ⭐
  // Inclut les en-têtes et la gestion d'erreur
  refuseDemande(demandeId: number, commentaire: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${demandeId}/refuser`, { commentaire }, { headers }).pipe(
      catchError(this.handleError)
    );
  }
  
  validateDemandeWithSignature(demandeId: number, payload: { commentaire: string, signatureBase64: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${demandeId}/valider`, payload, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getJournals(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUtilsUrl}/journals`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getPersonnes(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(this.apiPersonnesUrl, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getBudgetByCode(codeBudgetaire: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUtilsUrl}/budgets?code=${codeBudgetaire}`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getBudgetsCurrentYear(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUtilsUrl}/budgets/currentYear`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getBudgetsByJournalId(journalId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUtilsUrl}/journals/${journalId}/budgets`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getDemandeStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/stats/general`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateDemandeStatus(id: number, updateData: { status: string; comments?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, updateData, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }
}
