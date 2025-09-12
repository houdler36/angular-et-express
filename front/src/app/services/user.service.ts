import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private API_URL = 'http://localhost:8081/api/';

  constructor(private http: HttpClient) {}

  /** Récupère le token depuis le localStorage */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // -------------------------------------------
  // PROFIL UTILISATEUR
  // -------------------------------------------

  /** Récupérer le profil de l’utilisateur connecté */
  getCurrentUser(): Observable<any> {
    return this.http.get(this.API_URL + 'users/me', { headers: this.getHeaders() });
  }

  /** Mettre à jour le profil de l’utilisateur connecté */
  updateUserProfile(userData: any): Observable<any> {
    return this.http.put(this.API_URL + 'users/me', userData, { headers: this.getHeaders() });
  }

  // -------------------------------------------
  // ADMINISTRATION UTILISATEUR
  // -------------------------------------------

  /** Créer un nouvel utilisateur admin */
  createAdminUser(userData: any): Observable<any> {
    return this.http.post(this.API_URL + 'users/admin/create-user', userData, { headers: this.getHeaders() });
  }

  /** Récupérer tous les utilisateurs */
  getUsersList(): Observable<any> {
    return this.http.get(this.API_URL + 'users/admin/users', { headers: this.getHeaders() });
  }

  /** Récupérer uniquement les utilisateurs RH */
  getRhUsersList(): Observable<any> {
    return this.http.get(this.API_URL + 'users/admin/rh-users', { headers: this.getHeaders() });
  }

  /** Récupérer un utilisateur par ID */
  getUserById(userId: number): Observable<any> {
    return this.http.get(this.API_URL + `users/admin/users/${userId}`, { headers: this.getHeaders() });
  }

  /** Mettre à jour un utilisateur existant (admin) */
  updateAdminUser(userId: number, userData: any): Observable<any> {
    return this.http.put(this.API_URL + `users/admin/users/${userId}`, userData, { headers: this.getHeaders() });
  }

  /** Supprimer un utilisateur (admin) */
  deleteAdminUser(userId: number): Observable<any> {
    return this.http.delete(this.API_URL + `users/admin/users/${userId}`, { headers: this.getHeaders() });
  }

  // -------------------------------------------
  // JOURNAUX
  // -------------------------------------------

  /** Récupérer tous les journaux */
  getJournalsList(): Observable<any> {
    return this.http.get(this.API_URL + 'users/journals', { headers: this.getHeaders() });
  }

  // -------------------------------------------
  // SIGNATURE
  // -------------------------------------------

  /** Envoyer le fichier de signature */
  uploadSignature(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('signature', file, file.name);

    const token = localStorage.getItem('accessToken') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.post(this.API_URL + 'upload-signature', formData, { headers });
  }

  // -------------------------------------------
  // REMPLAÇANT RH
  // -------------------------------------------

  /** Récupérer tous les utilisateurs RH */
  getAllRhUsers(): Observable<any[]> {
    return this.getRhUsersList();
  }

  /** Définir le remplaçant RH pour l'utilisateur connecté */
  setDelegue(data: { delegue_id: number | null }): Observable<any> {
    return this.http.put(this.API_URL + 'users/me/delegue', data, { headers: this.getHeaders() });
  }

}
