import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { NumbersToWordsService } from '../../../services/numbers-to-words.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Personne {
  id: number;
  nom: string;
  prenom: string;
  poste?: string;
}

interface Budget {
  id: number;
  code_budget: string;
  description: string;
  annee_fiscale?: number;
  budget_annuel?: number;
  budget_trimestre_1?: number;
  budget_trimestre_2?: number;
  budget_trimestre_3?: number;
  budget_trimestre_4?: number;
}

interface DemandeDetail {
  id: number;
  demande_id: number;
  nature: string;
  libelle: string;
  beneficiaire: string;
  amount: number;
  nif_exists: 'oui' | 'non';
  numero_compte: string | null;
  budget_id: number | null;
  status_detail: 'en attente' | 'approuvée' | 'rejetée';
  nif?: string;
  stat?: string;
  budget?: Budget;
}

interface DemandeValidation {
  id: number;
  demande_id: number;
  user_id: number;
  statut: 'en attente' | 'approuvé' | 'rejeté' | 'validé' | 'initial';
  ordre: number;
  date_validation?: string;
  commentaire?: string;
  user?: {
    id: number;
    username: string;
    role: string;
    signature_image_url?: string
  } | null;
  signature_validation_url?: string;
  signatureBase64?: string | null;
  signatureFinale?: string | null;
  signatureUrl?: string | null;
}

interface Demande {
  id: number;
  userId: number;
  type: 'DED' | 'Recette' | 'ERD';
  journal_id: number | null;
  date: string;
  expected_justification_date: string | null;
  pj_status: 'oui' | 'pas encore';
  resp_pj_id: number | null;
  status: 'en attente' | 'approuvée' | 'rejetée';
  montant_total: number;
  description: string;
  numero_approuve_journal?: number;
  date_approuvee?: string;
  details?: DemandeDetail[];
  user?: { username: string };
  comments?: any[];
  journal?: { nom_journal: string; nom_projet: string; solde: number };
  validations?: DemandeValidation[];
  responsible_pj?: Personne;
}

@Component({
  selector: 'app-demande-pdf',
  templateUrl: './demande-pdf.component.html',
  styleUrls: ['./demande-pdf.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    TitleCasePipe
  ]
})
export class DemandePdfComponent implements OnInit {
  @Input() demande: Demande | null = null;
  @Input() displayValidators: DemandeValidation[] = [];
  @Input() montantEnLettres: string = '';
  @Input() hasLogo: boolean = true;
  @Input() serverUrl: string = 'http://192.168.88.42:8081';
  @Input() companyInfo: string = 'SALAFA - Adresse · Téléphone · Email';

  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;

  totalDebit = 0;
  totalCredit = 0;
  solde = 0;

  constructor(private numbersToWordsService: NumbersToWordsService) {}

  ngOnInit(): void {
    if (this.demande) {
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    this.totalDebit = 0;
    this.totalCredit = 0;

    if (this.demande && this.demande.details) {
      this.demande.details.forEach((detail, index) => {
        const montant = typeof detail.amount === 'string' ? parseFloat(detail.amount) : detail.amount;

        if (this.demande!.type === 'DED') {
          this.totalDebit += montant;
        } else if (this.demande!.type === 'Recette') {
          this.totalCredit += montant;
        } else if (this.demande!.type === 'ERD') {
          if (index === 0) this.totalCredit += montant;
          else this.totalDebit += montant;
        }
      });

      this.solde = this.totalDebit - this.totalCredit;
    }
  }

  getBudgetTrimestre(detail: DemandeDetail, demandeDate: string): number {
    if (!detail?.budget || !demandeDate) return 0;

    const mois = new Date(demandeDate).getMonth() + 1;
    let budgetTrimestre = 0;

    if (mois >= 1 && mois <= 3) budgetTrimestre = detail.budget.budget_trimestre_1 || 0;
    else if (mois >= 4 && mois <= 6) budgetTrimestre = detail.budget.budget_trimestre_2 || 0;
    else if (mois >= 7 && mois <= 9) budgetTrimestre = detail.budget.budget_trimestre_3 || 0;
    else if (mois >= 10 && mois <= 12) budgetTrimestre = detail.budget.budget_trimestre_4 || 0;

    return budgetTrimestre;
  }

  getSoldeDisponible(detail: DemandeDetail): number {
    if (!detail?.budget) return 0;

    const budgetTrimestre = this.getBudgetTrimestre(detail, this.demande?.date || '');
    return Math.max(0, budgetTrimestre - detail.amount);
  }

  getDemandeReference(): string {
    if (!this.demande) return '';

    const typeMap: { [key: string]: string } = {
      'DED': 'DED',
      'Recette': 'REC',
      'ERD': 'ERD'
    };

    const type = typeMap[this.demande.type] || 'DEM';
    const date = new Date(this.demande.date);
    const year = date.getFullYear();

    return `${type}-${this.demande.id}-${year}`;
  }

  async generatePDF() {
    if (!this.demande || !this.pdfContent) {
      console.error('Demande or PDF content not available');
      return;
    }

    try {
      await this.prepareSignaturesForPDF(this.pdfContent.nativeElement);

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

      // Update total pages in footer if needed, but since we don't know total yet, just number them
      // For simplicity, we'll number them sequentially

      const fileName = this.getPDFFileName();
      pdf.save(fileName);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  }

  async prepareSignaturesForPDF(pdfElement: HTMLElement): Promise<void> {
    const signatureContainers = pdfElement.querySelectorAll('.signature-container');

    for (let i = 0; i < signatureContainers.length; i++) {
      const container = signatureContainers[i] as HTMLElement;
      const validatorIndex = i;
      const validator = this.displayValidators[validatorIndex];

      if (validator?.signatureBase64 || validator?.signatureUrl) {
        const imgElements = container.querySelectorAll('img');
        imgElements.forEach((img: HTMLImageElement) => {
          img.src = validator.signatureBase64 || validator.signatureUrl!;
        });
      }
    }
  }

  getPDFFileName(): string {
    if (!this.demande) return 'Demande.pdf';

    const typeMap: { [key: string]: string } = {
      'DED': 'DED',
      'Recette': 'Recette',
      'ERD': 'ERD'
    };

    const type = typeMap[this.demande.type] || 'Demande';
    const date = new Date(this.demande.date).toISOString().split('T')[0];

    return `${type}_${this.demande.id}_${date}.pdf`;
  }
}
