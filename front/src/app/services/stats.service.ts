// src/app/services/stats.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  // Replace this with the actual URL of your backend API
  private apiUrl = 'http://localhost:8081/api/stats';

  constructor(private http: HttpClient) { }

  /**
   * Fetches dashboard statistics from the backend API.
   * @returns An Observable containing the JSON data for the statistics.
   */
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}