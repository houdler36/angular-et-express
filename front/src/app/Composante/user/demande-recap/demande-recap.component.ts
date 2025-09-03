import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DemandeService } from '../../../services/demande.service';
import { HttpClientModule } from '@angular/common/http';

interface Demande {
  id: number;
  description: string;
  montant_total: number;
  date: string;
  pj_status: string;
}

@Component({
  selector: 'app-demande-recap',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, HttpClientModule],
  templateUrl: './demande-recap.component.html',
  styleUrls: ['./demande-recap.component.scss']
})
export class DemandeRecapComponent implements OnInit {
  demandes: Demande[] = [];
  loading = true;
  errorMessage: string | null = null;

  constructor(private demandeService: DemandeService, private router: Router) {}

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.loading = true;
    
    // ⭐ Correction ici : Appelle la bonne méthode pour obtenir les demandes avec PJ en attente
    this.demandeService.getDemandesPJNonFournies().subscribe({
      next: (data: Demande[]) => {
        // Le filtre n'est plus nécessaire ici car il est fait sur le serveur.
        this.demandes = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des demandes';
        this.loading = false;
      }
    });
  }

  ajouterDemande(d: Demande): void {
    this.router.navigate(['/demandes/new'], {
      queryParams: {
        type: 'ERD',
        description: d.description,
        montant: d.montant_total,
        dedId: d.id
      }
    });
  }
}
