import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ValidationRhService {
  private baseUrl = `${environment.apiUrl}/orders`; // adapte selon backend

  constructor(private http: HttpClient) {}

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  validateOrder(orderId: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${orderId}/validate`, {});
  }
}
