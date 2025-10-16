// src/app/services/personne-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Personne } from '../models/personne';
import { environment } from '../../environments/environment';

const baseUrl = `${environment.apiUrl}/personnes`; // URL vers le backend personnes

@Injectable({
  providedIn: 'root'
})
export class PersonneApiService {

  constructor(private http: HttpClient) { }

  // Récupère toutes les personnes (GET /api/personnes)
  getAll(): Observable<Personne[]> {
    return this.http.get<Personne[]>(baseUrl);
  }

  // Crée une nouvelle personne (POST /api/personnes)
  create(personne: Personne): Observable<Personne> {
    return this.http.post<Personne>(baseUrl, personne);
  }

  // Met à jour une personne (PUT /api/personnes/:id)
  update(id: number, personne: Personne): Observable<Personne> {
    return this.http.put<Personne>(`${baseUrl}/${id}`, personne);
  }

  // Supprime une personne (DELETE /api/personnes/:id)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${baseUrl}/${id}`);
  }
}
