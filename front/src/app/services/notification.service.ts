import { Injectable } from '@angular/core';

@Injectable({
  // 'providedIn: 'root' rend le service disponible partout
  // et résout l'erreur NG2003 en fournissant un jeton d'injection.
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  /**
   * Affiche un message de succès à l'utilisateur.
   * Dans une application réelle, ceci afficherait une 'toast' verte.
   * @param message Le message à afficher.
   */
  showSuccess(message: string): void {
    console.log(`[SUCCÈS] : ${message}`);
    // Utiliser une alerte simple pour le moment
    // Remplacer par une librairie de notification (ex: MatSnackBar, Toastr) pour la production
    alert(`✅ Succès: ${message}`);
  }

  /**
   * Affiche un message d'erreur à l'utilisateur.
   * Dans une application réelle, ceci afficherait une 'toast' rouge.
   * @param message Le message à afficher.
   */
  showError(message: string): void {
    console.error(`[ERREUR] : ${message}`);
    // Utiliser une alerte simple pour le moment
    alert(`❌ Erreur: ${message}`);
  }

  /**
   * Affiche un message d'avertissement à l'utilisateur.
   * Dans une application réelle, ceci afficherait une 'toast' jaune.
   * @param message Le message à afficher.
   */
  showWarning(message: string): void {
    console.warn(`[ATTENTION] : ${message}`);
    // Utiliser une alerte simple pour le moment
    alert(`⚠️ Attention: ${message}`);
  }

  /**
   * Affiche un message d'information.
   * @param message Le message à afficher.
   */
  showInfo(message: string): void {
    console.info(`[INFO] : ${message}`);
    alert(`ℹ️ Information: ${message}`);
  }
}