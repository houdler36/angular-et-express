import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { of, Observable, throwError } from 'rxjs';
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

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
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

  // === GESTION DES TOURS DE VALIDATION ===
  validateCurrentTour(demandeId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    // URL corrigée : /api/demandes/{id}/validate-tour
    return this.http.post(`${this.apiUrl}/${demandeId}/validate-tour`, {}, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  rejectCurrentTour(demandeId: number, reason: string): Observable<any> {
    const headers = this.getAuthHeaders();
    // URL corrigée : /api/demandes/{id}/reject-tour
    return this.http.post(`${this.apiUrl}/${demandeId}/reject-tour`, { reason }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // === INFORMATIONS UTILISATEUR ===
  getCurrentUserId(): Observable<number> {
    const user = this.tokenStorageService.getUser();
    const userId = user?.id || 0;
    console.log('🔍 Service - ID utilisateur:', userId);
    return of(userId);
  }

  getCurrentUserRole(): Observable<string> {
    const user = this.tokenStorageService.getUser();
    const role = user?.role || '';
    console.log('🔍 Service - Rôle utilisateur:', role);
    return of(role);
  }

  // === MÉTHODES EXISTANTES (conservées) ===
  createDemande(demande: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, demande, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getAllDemandes(status?: string, userId?: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    let url = this.apiUrl;
    const params: any = {};
    if (status) params.status = status;
    if (userId) params.userId = userId;
    const queryString = new URLSearchParams(params).toString();
    if (queryString) url += `?${queryString}`;
    return this.http.get<any[]>(url, { headers }).pipe(
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
  
  getDemandesDAFAValider(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/daf-a-valider`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getDemandesAValiderParJournal(journalId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/avalider/journal/${journalId}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  validateDemande(demandeId: number, commentaire: string = ''): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${demandeId}/valider`, { commentaire }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getDemandesEnAttenteAutres(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/enattenteautres`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

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

  getBudgetInfoByCode(codeBudget: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/budgets/info/${codeBudget}`, { headers }).pipe(
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
    return this.http.get<any>(`${this.apiUrl}/stats/general`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateDemandeStatus(id: number, updateData: { status: string; comments?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, updateData, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  getRapportDemandesApprouvees(journalId: number, startDate: string, endDate: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<any[]>(`${this.apiUrl}/rapport/${journalId}`, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }

  getRapportByNomProjet(nomProjet: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/rapport-projet/${encodeURIComponent(nomProjet)}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getProjetsWithBudgets(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/projets-budgets`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getDemandesPJNonFournies(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/pj-non-fournies`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateDedStatus(dedId: number, status: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(
      `${this.apiUrl}/${dedId}/pj_status`,
      { pj_status: status },
      { headers }
    ).pipe(catchError(this.handleError));
  }

  getRapportFiltre(nomProjet: string, codeBudget: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    params = params.append('nom_projet', nomProjet);
    params = params.append('code_budget', codeBudget);
    return this.http.get<any[]>(`${this.apiUrl}/rapports/demandes-filtered`, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }
  
}