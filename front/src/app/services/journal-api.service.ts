import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const baseUrl = `${environment.apiUrl}/journals`;

@Injectable({
  providedIn: 'root'
})
export class JournalApiService {

  constructor(private http: HttpClient) {}

  getAllBudgets(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/budgets/all`);
  }

  // Cette méthode charge uniquement les utilisateurs RH
  getAllRhUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/admin/rh-users`);
  }

  createJournal(data: any): Observable<any> {
    return this.http.post(baseUrl, data);
  }

  getAllJournals(): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/all`);
  }
  
  // -------------------------
  // Méthodes pour la mise à jour et la suppression
  // -------------------------

  /**
   * Envoie une requête PUT pour mettre à jour un journal par son ID.
   * @param id L'ID du journal à mettre à jour.
   * @param data Les nouvelles données du journal.
   */
  updateJournal(id: number, data: any): Observable<any> {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  /**
   * Envoie une requête DELETE pour supprimer un journal par son ID.
   * @param id L'ID du journal à supprimer.
   */
  deleteJournal(id: number): Observable<any> {
    return this.http.delete(`${baseUrl}/${id}`);
  }
}
