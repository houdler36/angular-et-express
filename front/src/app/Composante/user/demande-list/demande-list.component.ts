// src/app/Composante/user/demande-list/demande-list.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DemandeService } from '../../../services/demande.service'; // <-- Assurez-vous que le chemin est correct

@Component({
  selector: 'app-demande-list',
  templateUrl: './demande-list.component.html',
  styleUrls: ['./demande-list.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, CurrencyPipe, DatePipe]
})
export class DemandeListComponent implements OnInit {
  demandes: any[] = [];
  errorMessage: string = '';

  // Injectez le DemandeService
  constructor(private demandeService: DemandeService) { }

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    console.log("Chargement des demandes depuis le backend...");
    this.demandeService.getAllDemandes().subscribe({
      next: (data) => {
        this.demandes = data;
        console.log("Demandes chargées :", this.demandes);
        this.errorMessage = '';
      },
      error: (err) => {
        console.error("Erreur lors du chargement des demandes :", err);
        this.errorMessage = 'Erreur lors du chargement des demandes. Veuillez vérifier la console pour plus de détails et assurez-vous que le backend est en cours d\'exécution.';
        this.demandes = []; // Vider la liste en cas d'erreur pour ne pas afficher de vieilles données
      }
    });
  }

 deleteDemande(id: number): void {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
    this.demandeService.deleteDemande(id).subscribe({
      next: () => {
        this.demandes = this.demandes.filter(d => d.id !== id);
        alert('Demande supprimée avec succès !');
        this.errorMessage = '';
      },
      error: (err) => {
        console.error("Erreur lors de la suppression de la demande :", err);
        this.errorMessage = 'Erreur lors de la suppression de la demande. Vous n\'avez peut-être pas les permissions ou la demande n\'existe pas.';
      }
    });
  }
}
}