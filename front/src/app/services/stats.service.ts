// src/app/services/stats.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  // Replace this with the actual URL of your backend API
  private apiUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) { }

  /**
   * Fetches dashboard statistics from the backend API.
   * @returns An Observable containing the JSON data for the statistics.
   */
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}