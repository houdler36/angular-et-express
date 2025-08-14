// src/app/services/budget-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:8081/api/budgets'; // mettre la base vers budgets

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
}
