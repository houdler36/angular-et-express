import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandeService } from '../../../services/demande.service';

@Component({
  selector: 'app-demande-list',
  templateUrl: './demande-list.component.html',
  styleUrls: ['./demande-list.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, CurrencyPipe, DatePipe, FormsModule]
})
export class DemandeListComponent implements OnInit {
  demandes: any[] = [];
  allDemandes: any[] = [];
  message: string = '';
  isSuccess: boolean = false;
  searchTerm: string = '';

  constructor(private demandeService: DemandeService) { }

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    console.log("Chargement des demandes depuis le backend...");
    this.demandeService.getAllDemandes().subscribe({
      next: (data) => {
        // Stocke la liste complète et triée
        this.allDemandes = data.sort((a, b) => b.id - a.id);
        // Initialise la liste affichée avec toutes les demandes
        this.demandes = this.allDemandes;
        console.log("Demandes chargées :", this.allDemandes);
        this.message = '';
        this.isSuccess = true;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des demandes :", err);
        this.message = 'Erreur lors du chargement des demandes. Veuillez vérifier la console pour plus de détails et assurez-vous que le backend est en cours d\'exécution.';
        this.isSuccess = false;
        this.demandes = [];
        this.allDemandes = [];
      }
    });
  }

  filterDemandes(): void {
    const term = this.searchTerm.toLowerCase();
    this.demandes = this.allDemandes.filter(demande => {
      // Convertit les champs en minuscules pour une recherche insensible à la casse
      const id = demande.id.toString().toLowerCase();
      const type = demande.type.toLowerCase();
      const description = demande.description.toLowerCase();
      const demandeur = `${demande.responsible_pj?.nom} ${demande.responsible_pj?.prenom}`.toLowerCase();
      const statut = demande.status.toLowerCase();

      // Vérifie si le terme de recherche est inclus dans l'un des champs
      return id.includes(term) ||
             type.includes(term) ||
             description.includes(term) ||
             demandeur.includes(term) ||
             statut.includes(term);
    });
  }

  deleteDemande(id: number): void {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      this.demandeService.deleteDemande(id).subscribe({
        next: () => {
          this.allDemandes = this.allDemandes.filter(d => d.id !== id);
          this.filterDemandes();
          this.message = 'Demande supprimée avec succès !';
          this.isSuccess = true;
        },
        error: (err) => {
          console.error("Erreur lors de la suppression de la demande :", err);
          this.message = 'Erreur lors de la suppression de la demande. Vous n\'avez peut-être pas les permissions ou la demande n\'existe pas.';
          this.isSuccess = false;
        }
      });
    }
  }
}