// src/app/services/budget-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:8081/api';

@Injectable({
  providedIn: 'root'
})
export class BudgetApiService {

  constructor(private http: HttpClient) { }

  getAllBudgets(): Observable<any[]> {
    // Récupère tous les budgets
    return this.http.get<any[]>(`${baseUrl}/budgets/all`);
  }

  createBudget(data: any): Observable<any> {
    // Crée un nouveau budget
    return this.http.post(`${baseUrl}/budgets`, data);
  }
}