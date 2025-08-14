// src/app/services/demande-update.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DemandeUpdateService {
  // Un Subject est un Observable qui peut aussi émettre des valeurs
  private demandeUpdatedSource = new Subject<void>();

  // Observable que les composants peuvent écouter
  demandeUpdated$ = this.demandeUpdatedSource.asObservable();

  constructor() { }

  /**
   * Méthode pour notifier tous les abonnés qu'une demande a été mise à jour.
   */
  notifyDemandeUpdate(): void {
    this.demandeUpdatedSource.next();
  }
}
