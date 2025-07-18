import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:8081/api/auth/'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post(API_URL + 'signin', {
      username,
      password
    });
  }
  register(username: string, email: string, password: string): Observable<any> {
  return this.http.post(`${API_URL}/auth/register`, {
    username,
    email, 
    password
  });
}
}