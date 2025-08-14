import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:8081/api/journals';

@Injectable({
  providedIn: 'root'
})
export class JournalApiService {

  constructor(private http: HttpClient) {}

  getAllBudgets(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8081/api/budgets/all`);
  }

  getAllRhUsers(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8081/api/users/admin/rh-users`);
  }

  createJournal(data: any): Observable<any> {
    return this.http.post(baseUrl, data);
  }

  getAllJournals(): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/all`);
  }
}
