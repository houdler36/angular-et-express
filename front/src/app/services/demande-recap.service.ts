import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DemandeService } from './demande.service';
import { Demande } from '../models/demande';

@Injectable({
  providedIn: 'root'
})
export class DemandeRecapService {

  constructor(private demandeService: DemandeService) { }

  getRecapByDemandeType(): Observable<{ type: string, count: number, totalAmount: number }[]> {
    console.log("Démarrage de la récupération du récapitulatif des dépenses...");
    return this.demandeService.getAllDemandes().pipe(
      map(demandes => {
        const recapMap = new Map<string, { count: number, totalAmount: number }>();

        demandes.forEach(demande => {
          const type = demande.type;
          const montant = demande.montant_total;

          if (recapMap.has(type)) {
            const currentStat = recapMap.get(type)!;
            currentStat.count += 1;
            currentStat.totalAmount += montant;
          } else {
            recapMap.set(type, { count: 1, totalAmount: montant });
          }
        });

        // Convertir la Map en un tableau d'objets pour le front-end
        const recapArray = Array.from(recapMap, ([type, data]) => ({
          type: type,
          count: data.count,
          totalAmount: data.totalAmount
        }));
        
        console.log("Récapitulatif généré :", recapArray);
        return recapArray;
      }),
      catchError(error => {
        console.error("Erreur lors de la génération du récapitulatif des dépenses", error);
        return of([]); // Retourne un tableau vide en cas d'erreur
      })
    );
  }
}
