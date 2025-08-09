// src/app/services/journal-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:8081/api';

@Injectable({
  providedIn: 'root'
})
export class JournalApiService {

  constructor(private http: HttpClient) { }

  getAllBudgets(): Observable<any[]> {
    // Récupère tous les budgets
    return this.http.get<any[]>(`${baseUrl}/budgets/all`);
  }

  createJournal(data: any): Observable<any> {
    // Crée un nouveau journal et l'associe à des budgets
    return this.http.post(`${baseUrl}/journals`, data);
  }

  getAllJournals(): Observable<any[]> {
    // Récupère tous les journaux avec leurs budgets associés
    return this.http.get<any[]>(`${baseUrl}/journals`);
  }
}