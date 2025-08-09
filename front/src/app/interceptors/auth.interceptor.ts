// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service'; // Assurez-vous du chemin correct vers votre service de stockage

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private tokenStorage: TokenStorageService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = request;
    const token = this.tokenStorage.getToken(); // Récupère le jeton stocké

    if (token != null) {
      // Si un jeton existe, clone la requête et ajoute l'en-tête Authorization
      // Le format doit être 'Bearer <token>'
      authReq = request.clone({
        headers: request.headers.set('Authorization', 'Bearer ' + token)
      });
    }

    return next.handle(authReq); // Passe la requête (modifiée ou originale) au prochain gestionnaire
  }
}
