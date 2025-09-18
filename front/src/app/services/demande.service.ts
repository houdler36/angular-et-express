import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse,HttpParams } from '@angular/common/http';
import {of, Observable, throwError } from 'rxjs';
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

 getAllDemandes(status?: string, userId?: number): Observable<any[]> {
  const headers = this.getAuthHeaders();
  let url = this.apiUrl;

  // Ajouter les paramètres de query si nécessaires
  const params: any = {};
  if (status) params.status = status;
  if (userId) params.userId = userId;

  const queryString = new URLSearchParams(params).toString();
  if (queryString) url += `?${queryString}`;

  return this.http.get<any[]>(url, { headers }).pipe(
    catchError(this.handleError)
  );
}



getCurrentUserRole(): Observable<string> {
  // Récupérer le rôle depuis le token ou le localStorage
  const user = this.tokenStorageService.getUser();
  const role = user?.role || 'UTILISATEUR'; // par défaut si non défini
  return of(role);
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
  
  // ✅ NOUVELLE FONCTION POUR LE DAF
  getDemandesDAFAValider(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/daf-a-valider`, { headers: headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ⭐ NOUVELLE FONCTION POUR VALIDER PAR JOURNAL ⭐
  getDemandesAValiderParJournal(journalId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/avalider/journal/${journalId}`, { headers }).pipe(
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
getDemandesEnAttenteAutres(): Observable<any[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<any[]>(`${this.apiUrl}/enattenteautres`, { headers }).pipe(
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
  // ✅ NOUVELLE FONCTION POUR RÉCUPÉRER LES INFORMATIONS DU BUDGET PAR CODE
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

// Récupérer les stats pour l'utilisateur connecté uniquement
// Récupérer les stats pour l'utilisateur connecté uniquement
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

// Récupérer les demandes approuvées filtrées par journal
getRapportDemandesApprouvees(journalId: number): Observable<any[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<any[]>(`${this.apiUrl}/rapport/${journalId}`, { headers }).pipe(
    catchError(this.handleError)
  );
}
// ✅ NOUVELLE FONCTION POUR LES RAPPORTS PAR NOM DE PROJET
getRapportByNomProjet(nomProjet: string): Observable<any[]> {
  const headers = this.getAuthHeaders();
  // Utiliser encodeURIComponent pour s'assurer que le nom de projet dans l'URL est correct
  return this.http.get<any[]>(`${this.apiUrl}/rapport-projet/${encodeURIComponent(nomProjet)}`, { headers }).pipe(
    catchError(this.handleError)
  );
}
// Récupérer tous les projets avec leurs budgets associés
getProjetsWithBudgets(): Observable<any[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<any[]>(`${this.apiUrl}/projets-budgets`, { headers }).pipe(
    catchError(this.handleError)
  );
}

// Récupérer les demandes dont les PJ ne sont pas encore fournies
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

  // L'URL doit correspondre à la route que vous avez configurée dans votre backend
  return this.http.get<any[]>(`${this.apiUrl}/rapports/demandes-filtered`, { headers, params }).pipe(
    catchError(this.handleError)
  );
}


}
