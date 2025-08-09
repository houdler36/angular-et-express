// Fichier : src/app/services/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// L'URL de base de l'API est correcte
const API_URL = 'http://localhost:8081/api/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  /**
   * Crée un nouvel utilisateur en tant qu'administrateur.
   * CORRECTION: L'URL a été ajustée pour correspondre au routeur back-end.
   * La nouvelle URL est '/api/users/admin/create-user'.
   * @param userData Les données du nouvel utilisateur (username, email, password, role, journalIds).
   * @returns Un Observable qui émet la réponse de l'API.
   */
  createAdminUser(userData: any): Observable<any> {
    return this.http.post(API_URL + 'users/admin/create-user', userData, httpOptions);
  }

  /**
   * Récupère la liste de tous les utilisateurs.
   * CORRECTION: L'URL a été ajustée pour correspondre au routeur back-end.
   * La nouvelle URL est '/api/users/admin/users'.
   * @returns Un Observable qui émet un tableau d'utilisateurs.
   */
  getUsersList(): Observable<any> {
    return this.http.get(API_URL + 'users/admin/users', httpOptions);
  }

  /**
   * Récupère la liste de tous les journaux.
   * CORRECTION: L'URL a été ajustée pour correspondre au routeur back-end.
   * La nouvelle URL est '/api/users/journals'.
   * @returns Un Observable qui émet un tableau de journaux.
   */
  getJournalsList(): Observable<any> {
    return this.http.get(API_URL + 'users/journals', httpOptions);
  }
}
