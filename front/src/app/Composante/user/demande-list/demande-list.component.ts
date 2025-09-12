import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DemandeService } from '../../../services/demande.service';

@Component({
  selector: 'app-demande-list',
  templateUrl: './demande-list.component.html',
  styleUrls: ['./demande-list.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, CurrencyPipe, DatePipe]
})
export class DemandeListComponent implements OnInit {
  demandes: any[] = [];
  message: string = '';
  isSuccess: boolean = false;

  constructor(private demandeService: DemandeService) { }

  ngOnInit(): void {
    this.loadDemandes();
  }

 loadDemandes(): void {
  console.log("Chargement des demandes depuis le backend...");
  this.demandeService.getAllDemandes().subscribe({
    next: (data) => {
      // Tri décroissant par ID
      this.demandes = data.sort((a, b) => b.id - a.id);
      console.log("Demandes chargées :", this.demandes);
      this.message = '';
      this.isSuccess = true;
    },
    error: (err) => {
      console.error("Erreur lors du chargement des demandes :", err);
      this.message = 'Erreur lors du chargement des demandes. Veuillez vérifier la console pour plus de détails et assurez-vous que le backend est en cours d\'exécution.';
      this.isSuccess = false;
      this.demandes = [];
    }
  });
}


  deleteDemande(id: number): void {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
        this.demandeService.deleteDemande(id).subscribe({
            next: () => {
                this.demandes = this.demandes.filter(d => d.id !== id);
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
