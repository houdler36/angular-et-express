// dashboard-user.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DemandeService } from '../../../services/demande.service';
import { DemandeUpdateService } from '../../../services/demande-update.service';
import { DemandeRecapService } from '../../../services/demande-recap.service';
import { Demande } from '../../../models/demande';
import { DemandeFormComponent } from '../demande-form/demande-form.component';
import { DemandeListComponent } from '../demande-list/demande-list.component';
import { DemandeRecapComponent } from '../demande-recap/demande-recap.component';
import { Router } from '@angular/router';
import { RapportdemandeComponent } from '../rapport-demande/rapport-demande.component';


@Component({
  selector: 'app-dashboard-user',
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DemandeFormComponent,
    DemandeListComponent,
    DemandeRecapComponent,
    RapportdemandeComponent
  ]
})
export class DashboardUserComponent implements OnInit, OnDestroy {
  totalDemandes = 0;
  demandesEnAttente = 0;
  demandesApprouvees = 0;
  demandesRejetees = 0;
  allDemandes: Demande[] = [];
  lastDemandes: Demande[] = [];
  searchTerm = '';
  demandeStats: { type: string, count: number, totalAmount: number }[] = [];
  errorMessage = '';
  private updateSubscription!: Subscription;


  showNewDemandeForm = false;
  showDemandeList = false;
  showDemandeRecap = false;
  showRapportDemande = false;

  constructor(
    private demandeService: DemandeService,
    private demandeUpdateService: DemandeUpdateService,
    private demandeRecapService: DemandeRecapService,
    private router: Router,
  ) {}
  goToDemande(id?: number) {
  if (id != null) {
    this.router.navigate(['/demandes', id]);
  }
}

  ngOnInit(): void {
    this.loadDemandes();
    this.loadDemandeStats();
    this.loadDemandeRecapStats();

    this.updateSubscription = this.demandeUpdateService.demandeUpdated$.subscribe(() => {
      this.loadDemandes();
      this.loadDemandeStats();
      this.loadDemandeRecapStats();
    });
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
  }
  
  toggleNewDemandeForm(state: boolean) {
    this.showNewDemandeForm = state;
    this.showDemandeList = false;
    this.showDemandeRecap = false;
  }

  toggleDemandeList(state: boolean) {
    this.showDemandeList = state;
    this.showNewDemandeForm = false;
    this.showDemandeRecap = false;
  }

  toggleDemandeRecap(state: boolean) {
    this.showDemandeRecap = state;
    this.showNewDemandeForm = false;
    this.showDemandeList = false;
  }
  

toggleRapportDemande(state: boolean) {
  this.showRapportDemande = state;
  this.showNewDemandeForm = false;
  this.showDemandeList = false;
  this.showDemandeRecap = false;
}

  onFormSubmitted() {
    this.showNewDemandeForm = false;
    this.loadDemandes();
    this.loadDemandeStats();
    this.loadDemandeRecapStats();
  }

  loadDemandes() {
    this.demandeService.getAllDemandes().subscribe({
      next: (data: any[]) => {
        this.allDemandes = data.map(d => ({ ...d, date: new Date(d.date) }));
        this.lastDemandes = this.allDemandes;
        if (this.searchTerm) this.applyFilter();
      },
      error: (err) => this.errorMessage = 'Erreur lors du chargement des demandes : ' + err.message
    });
  }

  loadDemandeStats() {
    this.demandeService.getDemandeStats().subscribe({
      next: stats => {
        this.totalDemandes = stats.total;
        this.demandesEnAttente = stats.enAttente;
        this.demandesApprouvees = stats.finalisees;
        this.demandesRejetees = 0;
      },
      error: err => this.errorMessage = 'Erreur lors du chargement des stats : ' + (err.error?.message || err.message)
    });
  }

  loadDemandeRecapStats() {
    this.demandeRecapService.getRecapByDemandeType().subscribe({
      next: stats => this.demandeStats = stats,
      error: err => this.errorMessage = 'Erreur lors du chargement du récap : ' + (err.error?.message || err.message)
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.lastDemandes = this.allDemandes;
    } else {
      this.lastDemandes = this.allDemandes.filter(d => {
        const dateFormatted = (d.date as any) instanceof Date ?
          `${(d.date as any).getDate().toString().padStart(2,'0')}-${((d.date as any).getMonth()+1).toString().padStart(2,'0')}-${(d.date as any).getFullYear()}` : '';
        return (d.type?.toLowerCase().includes(term) ||
                d.montant_total?.toString().includes(term) ||
                d.status?.toLowerCase().includes(term) ||
                dateFormatted.includes(term));
      });
    }
  }
  

}
