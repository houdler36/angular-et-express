import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Demande } from '../models/demande';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class DemandeService {
  private apiUrl = 'http://localhost:8081/api/demandes';

  constructor(
    private http: HttpClient,
    private tokenStorageService: TokenStorageService
  ) { }

  /**
   * Prépare les en-têtes HTTP avec le jeton d'authentification.
   * Utilise l'en-tête standard 'Authorization' avec le préfixe 'Bearer'.
   */
  getAuthHeaders(): HttpHeaders {
    const user = this.tokenStorageService.getUser();
    if (user && user.accessToken) {
      return new HttpHeaders({ 'Authorization': 'Bearer ' + user.accessToken });
    }
    return new HttpHeaders();
  }

  getAllDemandes(): Observable<Demande[]> {
    return this.http.get<Demande[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getDemandeById(id: string): Observable<Demande> {
    return this.http.get<Demande>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createDemande(demande: Demande): Observable<Demande> {
    return this.http.post<Demande>(this.apiUrl, demande, { headers: this.getAuthHeaders() });
  }

  /**
   * Met à jour une demande existante.
   * Accepte un objet Partiel<Demande> pour permettre des mises à jour partielles.
   */
  updateDemande(id: string, demande: Partial<Demande>): Observable<Demande> { // <--- MODIFIÉ ICI
    return this.http.put<Demande>(`${this.apiUrl}/${id}`, demande, { headers: this.getAuthHeaders() });
  }

  deleteDemande(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Met à jour le statut d'une demande.
   * Utilise la méthode updateDemande générique avec un objet Partiel.
   */
  updateDemandeStatus(id: string, updateData: { status: string; comments?: string }): Observable<any> { // <--- NOUVELLE MÉTHODE SPÉCIFIQUE
    // Cette méthode appelle simplement updateDemande avec les données nécessaires
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, updateData, { headers: this.getAuthHeaders() });
  }

  getDemandeStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/general`, { headers: this.getAuthHeaders() });
  }
}
