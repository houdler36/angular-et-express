import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandeService } from '../../../services/demande.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-rapport-demande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rapport-demande.component.html',
  styleUrls: ['./rapport-demande.component.scss']
})
export class RapportdemandeComponent implements OnInit {
  journals: any[] = [];
  selectedJournalId: number | null = null;
  demandes: any[] = [];
  loading = false;
  errorMessage = '';
  startDate: string = '';
  endDate: string = '';

  // Propriétés pour le tri
  sortField: string = 'date_approuve';
  sortDirection: 'asc' | 'desc' = 'asc';

  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.loadJournals();
  }

  loadJournals() {
    this.demandeService.getJournals().subscribe({
      next: data => this.journals = data,
      error: err => this.errorMessage = 'Erreur lors du chargement des journaux'
    });
  }

  loadRapport() {
    if (!this.selectedJournalId || !this.startDate || !this.endDate) {
      console.log('Paramètres manquants:', {
        journalId: this.selectedJournalId,
        startDate: this.startDate,
        endDate: this.endDate
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.demandes = [];

    console.log('Envoi de la requête avec:', {
      journalId: this.selectedJournalId,
      startDate: this.startDate,
      endDate: this.endDate
    });

    this.demandeService.getRapportDemandesApprouvees(
      this.selectedJournalId,
      this.startDate,
      this.endDate
    ).subscribe({
      next: data => {
        console.log('Réponse reçue:', data);
        this.demandes = data;
        // Appliquer le tri initial par date
        this.sortBy('date_approuve');
        this.loading = false;
      },
      error: err => {
        console.error('Erreur détaillée:', err);
        this.errorMessage = 'Erreur lors du chargement du rapport';
        this.loading = false;
      }
    });
  }

  // Tri des colonnes
  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.demandes.sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Gestion des valeurs nulles
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Tri numérique pour les champs spécifiques
      if (field === 'montant_total' || field === 'soldeProgressif' || field === 'id') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      // Tri des dates
      if (field === 'date_approuve') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }

  // Export vers Excel (CSV)
  exportToExcel() {
    if (this.demandes.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = [
      'Date Approuvé',
      'ID',
      'Numéro Journal',
      'Motif',
      'Type',
      'Encaissement',
      'Décaissement',
      'Solde Progressif'
    ];

    const data = this.demandes.map(d => [
      this.formatDate(d.date_approuve), // Utiliser formatDate pour l'export
      d.id,
      d.numero_journal_approuve || '-',
      d.motif || d.description,
      d.type,
      (d.type === 'Recette' || (d.type === 'ERD' && d.montant_total >= 0)) ? this.formatCurrencyForExport(this.getAbsoluteValue(d.montant_total)) : '-',
      (d.type === 'DED' || (d.type === 'ERD' && d.montant_total < 0)) ? this.formatCurrencyForExport(this.getAbsoluteValue(d.montant_total)) : '-',
      this.formatCurrencyForExport(d.soldeProgressif)
    ]);

    let csvContent = headers.join(';') + '\n';
    data.forEach(row => {
      csvContent += row.join(';') + '\n';
    });

    // Création et téléchargement du fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_demandes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Format de devise pour l'export (sans espace)
  formatCurrencyForExport(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) return '';
    return Number(amount).toFixed(2).replace('.', ',');
  }

  // ✅ Début de solde (solde avant la première opération)
  getDebutSolde(): number {
    if (this.demandes.length === 0) return 0;

    const first = this.demandes[0];
    const soldeProgressif = Number(first.soldeProgressif) || 0;
    const montant = Number(first.montant_total) || 0;

    // Pour retrouver le solde initial, on soustrait l'effet de la première opération
    if (first.type === 'Recette' || first.type === 'ERD') {
      return soldeProgressif - montant;
    } else if (first.type === 'DED') {
      return soldeProgressif + montant;
    }
    
    return soldeProgressif;
  }

  // ✅ État de solde (dernier solde progressif)
  getEtatSolde(): number {
    if (this.demandes.length === 0) return 0;
    const last = this.demandes[this.demandes.length - 1];
    return Number(last.soldeProgressif) || 0;
  }

  // Format date seule (sans heure)
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Ancienne fonction formatDateTime renommée pour éviter la confusion
  // (conservée au cas où vous en auriez besoin ailleurs)
  formatDateTime(dateStr: string | null | undefined): string {
    // Délégue à formatDate pour n'avoir qu'une seule fonction de formatage
    return this.formatDate(dateStr);
  }

  // Format monnaie
  formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) return '-';
    return Number(amount).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Méthode pour obtenir la valeur absolue
  getAbsoluteValue(amount: number | string | null | undefined): number {
    if (amount === null || amount === undefined) return 0;
    return Math.abs(Number(amount));
  }

  // ✅ Totaux avec Number()
  getTotalDecaissement(): number {
    return this.demandes
      .filter(d => d.type === 'DED' || (d.type === 'ERD' && Number(d.montant_total) < 0))
      .reduce((sum, d) => sum + Math.abs(Number(d.montant_total) || 0), 0);
  }

  getTotalEncaissement(): number {
    return this.demandes
      .filter(d => d.type === 'Recette' || (d.type === 'ERD' && Number(d.montant_total) >= 0))
      .reduce((sum, d) => sum + Math.abs(Number(d.montant_total) || 0), 0);
  }

  // Export vers PDF
  async exportToPDF() {
    if (this.demandes.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    if (!this.pdfContent) {
      console.error('Contenu PDF non disponible');
      return;
    }

    try {
      const canvas = await html2canvas(this.pdfContent.nativeElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      let totalPages = Math.ceil(imgHeight / pageHeight);
      const lastPageHeight = imgHeight - ((totalPages - 1) * pageHeight);
      if (totalPages > 1 && lastPageHeight < pageHeight / 2) {
        totalPages--;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const yOffset = -page * pageHeight;
        const remainingHeight = imgHeight - page * pageHeight;
        const actualHeight = Math.min(pageHeight, remainingHeight);

        pdf.addImage(canvas, 'PNG', 0, yOffset, imgWidth, actualHeight);

        // Add page number
        pdf.setFontSize(10);
        pdf.text(`Page ${page + 1}/${totalPages}`, 105, 287, { align: 'center' });
      }

      const fileName = this.getPDFFileName();
      pdf.save(fileName);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  }

  getPDFFileName(): string {
    const selectedJournal = this.journals.find(j => j.id_journal === this.selectedJournalId);
    const journalName = selectedJournal ? selectedJournal.nom_journal.replace(/\s+/g, '_') : 'journal';
    const date = new Date().toISOString().split('T')[0];
    return `rapport_demandes_${journalName}_${date}.pdf`;
  }

  getSelectedJournalName(): string {
    const selectedJournal = this.journals.find(j => j.id_journal === this.selectedJournalId);
    return selectedJournal ? selectedJournal.nom_journal : 'N/A';
  }

  getCurrentDateFormatted(): string {
    return this.formatDate(new Date().toISOString());
  }
}
