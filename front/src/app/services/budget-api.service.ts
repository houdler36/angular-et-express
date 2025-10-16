// src/app/services/budget-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const baseUrl = `${environment.apiUrl}/budgets`;

@Injectable({
  providedIn: 'root'
})
export class BudgetApiService {

  constructor(private http: HttpClient) { }

  // Récupère tous les budgets (GET /api/budgets/all)
  getAllBudgets(): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/all`);
  }

  // Crée un nouveau budget (POST /api/budgets)
  createBudget(data: any): Observable<any> {
    return this.http.post(`${baseUrl}`, data);
  }

  // Supprime un budget (DELETE /api/budgets/{id})
  deleteBudget(id: number): Observable<any> {
    return this.http.delete(`${baseUrl}/${id}`);
  }

  // Optionnel: Met à jour un budget (PUT /api/budgets/{id})
  updateBudget(id: number, data: any): Observable<any> {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  // Optionnel: Récupère un budget par ID (GET /api/budgets/{id})
  getBudgetById(id: number): Observable<any> {
    return this.http.get<any>(`${baseUrl}/${id}`);
  }
}