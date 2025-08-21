import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
const token = localStorage.getItem('accessToken') || '';

// URL de base de l'API
const API_URL = 'http://localhost:8081/api/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
const headers = new HttpHeaders({
  'Authorization': `Bearer ${token}`
});
@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  /** Créer un nouvel utilisateur admin */
  createAdminUser(userData: any): Observable<any> {
    return this.http.post(API_URL + 'users/admin/create-user', userData, httpOptions);
  }

  /** Récupérer tous les utilisateurs */
  getUsersList(): Observable<any> {
    return this.http.get(API_URL + 'users/admin/users', httpOptions);
  }

  /** Récupérer uniquement les utilisateurs RH */
  getRhUsersList(): Observable<any> {
    return this.http.get(API_URL + 'users/admin/rh-users', httpOptions);
  }

  /** Récupérer un utilisateur par ID */
  getUserById(userId: number): Observable<any> {
    return this.http.get(API_URL + `users/admin/users/${userId}`, httpOptions);
  }

  /** Mettre à jour un utilisateur existant (admin) */
  updateAdminUser(userId: number, userData: any): Observable<any> {
    return this.http.put(API_URL + `users/admin/users/${userId}`, userData, httpOptions);
  }

  /** Supprimer un utilisateur (admin) */
  deleteAdminUser(userId: number): Observable<any> {
    return this.http.delete(API_URL + `users/admin/users/${userId}`, httpOptions);
  }

  /** Récupérer tous les journaux */
  getJournalsList(): Observable<any> {
    return this.http.get(API_URL + 'users/journals', httpOptions);
  }

  /** Envoyer le fichier de signature */
/** Envoyer le fichier de signature */
uploadSignature(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('signature', file, file.name);

  const token = localStorage.getItem('accessToken') || '';

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(API_URL + 'upload-signature', formData, { headers });
}

}
