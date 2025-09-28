import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemandeService } from '../../../services/demande.service';
import { NumbersToWordsService } from '../../../services/numbers-to-words.service';
import { AuthService } from '../../../services/auth.service';
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
  signatureFinale?: string | null;
  signatureBase64?: string | null;
}

interface Journal {
  id: number;
  nom_journal: string;
  nom_projet: string;
  solde: number;
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
  details?: DemandeDetail[];
  user?: { username: string };
  comments?: any[];
  journal?: Journal;
  validations?: DemandeValidation[];
  responsible_pj?: Personne;
}

@Component({
  selector: 'app-demande-detail',
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    TitleCasePipe
  ]
})
export class DemandeDetailComponent implements OnInit {
  demandeId: number | null = null;
  demande: Demande | null = null;
  errorMessage = '';
  successMessage = '';
  finalValidatorName: string | null = null;
  serverUrl = 'http://localhost:8081';
  hasLogo = false;

  totalDebit = 0;
  totalCredit = 0;
  solde = 0;

  displayValidators: DemandeValidation[] = [];
  showDeleteConfirmModal = false;
  showRejectModal = false;
  rejectReason = '';
  montantEnLettres = '';

  showTooltip = false;
  selectedDetail: DemandeDetail | null = null;
  currentUserRole = '';
  currentUserId: number | null = null;

  // Variables pour la gestion des tours de validation
  currentValidationTour = 1;
  totalValidationTours = 1;
  showNextTourInfo = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeService,
    private authService: AuthService,
    private numbersToWordsService: NumbersToWordsService
  ) {}

  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.demandeId = +idFromRoute;
      console.log('🚀 Initialisation composant - Demande ID:', this.demandeId);
      this.loadDemandeDetails(this.demandeId);
      this.getCurrentUserInfo();
      this.checkLogoExists();
    } else {
      console.error('ID de demande manquant.');
      this.router.navigate(['/demandes']);
    }
  }

  getCurrentUserInfo(): void {
    console.group('🔍 DEBUG getCurrentUserInfo()');
    
    // Méthode 1: Token localStorage
    const token = localStorage.getItem('auth_token');
    console.log('🔐 Token présent:', !!token);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📄 Payload token:', payload);
        this.currentUserId = payload.id;
        this.currentUserRole = payload.role;
        console.log('✅ Utilisateur depuis token:', { 
          id: this.currentUserId, 
          role: this.currentUserRole 
        });
      } catch (error) {
        console.error('❌ Erreur décodage token:', error);
      }
    }

    // Méthode 2: AuthService avec getUserId()
    try {
      const userIdFromService = this.authService.getUserId();
      console.log('👤 ID utilisateur depuis AuthService.getUserId():', userIdFromService);
      
      if (userIdFromService && !this.currentUserId) {
        this.currentUserId = userIdFromService;
        console.log('✅ ID utilisateur mis à jour depuis AuthService:', this.currentUserId);
      }
    } catch (error) {
      console.error('❌ Erreur AuthService.getUserId():', error);
    }

    // Méthode 3: Service DemandeService (fallback)
    if (!this.currentUserRole) {
      console.log('🔄 Récupération rôle via DemandeService...');
      this.demandeService.getCurrentUserRole().subscribe({
        next: (role) => {
          console.log('✅ Rôle depuis DemandeService:', role);
          this.currentUserRole = role;
        },
        error: (error) => {
          console.error('❌ Erreur récupération rôle:', error);
        }
      });
    }

    if (!this.currentUserId) {
      console.log('🔄 Récupération ID via DemandeService...');
      this.demandeService.getCurrentUserId().subscribe({
        next: (id) => {
          console.log('✅ ID depuis DemandeService:', id);
          this.currentUserId = id;
        },
        error: (error) => {
          console.error('❌ Erreur récupération ID:', error);
        }
      });
    }

    console.log('🎯 Résultat final getCurrentUserInfo:', { 
      id: this.currentUserId, 
      role: this.currentUserRole 
    });
    console.groupEnd();
  }

  canViewBudget(): boolean {
    return this.currentUserRole === 'rh' || this.currentUserRole === 'daf';
  }

  showBudgetTooltip(detail: DemandeDetail): void {
    if (this.canViewBudget() && detail.budget) {
      this.selectedDetail = detail;
      this.showTooltip = true;
    }
  }

  hideBudgetTooltip(): void {
    this.showTooltip = false;
    this.selectedDetail = null;
  }

  calculateTotals(): void {
    this.totalDebit = 0;
    this.totalCredit = 0;

    if (this.demande && this.demande.details) {
      this.demande.details.forEach((detail, index) => {
        const montant = typeof detail.amount === 'string' ? parseFloat(detail.amount) : detail.amount;

        if (this.demande!.type === 'DED') {
          this.totalDebit += montant;
        }
        else if (this.demande!.type === 'Recette') {
          this.totalCredit += montant;
        }
        else if (this.demande!.type === 'ERD') {
          if (index === 0) this.totalCredit += montant;
          else this.totalDebit += montant;
        }
      });

      this.solde = this.totalDebit - this.totalCredit;
    }
  }

  async loadDemandeDetails(id: number): Promise<void> {
    console.log('📥 Chargement détails demande ID:', id);
    this.demandeService.getDemandeById(id).subscribe({
      next: async (data: Demande) => {
        console.log('✅ Données demande reçues:', data);
        this.demande = data;

        if (typeof this.demande.montant_total === 'string') {
          this.demande.montant_total = parseFloat(this.demande.montant_total);
        }

        if (this.demande.details) {
          this.demande.details.forEach(d => {
            if (typeof d.amount === 'string') d.amount = parseFloat(d.amount);
          });
        }

        this.calculateTotals();

        if (this.demande.montant_total !== undefined) {
          this.montantEnLettres = this.numbersToWordsService.convertNumberToWords(this.demande.montant_total);
        }

        await this.loadValidationsWithSignatures();
        this.calculateValidationTours();
        
        // Test de débogage après chargement complet
        setTimeout(() => this.testValidationConditions(), 500);
      },
      error: (error) => {
        console.error('❌ Erreur chargement demande:', error);
        this.errorMessage = 'Impossible de charger les détails de la demande.';
        this.demande = null;
      }
    });
  }

  async loadValidationsWithSignatures(): Promise<void> {
    console.group('🔍 DEBUG loadValidationsWithSignatures()');
    
    if (!this.demande?.validations) {
      console.log('❌ Aucune validation dans la demande');
      console.groupEnd();
      return;
    }

    console.log('📋 Validations originales:', this.demande.validations);
    
    const allValidations = this.demande.validations.sort((a, b) => a.ordre - b.ordre);
    console.log('📊 Validations triées:', allValidations);
    
    this.displayValidators = [];
    const maxValidators = 4;

    for (let i = 0; i < maxValidators; i++) {
      if (allValidations[i]) {
        const v = allValidations[i];
        console.log(`👤 Traitement validateur ${i + 1}:`, v.user);
        
        const finalSignature = v.signature_validation_url || v.user?.signature_image_url;
        const signatureBase64 = finalSignature ? await this.getImageAsBase64(this.serverUrl + finalSignature) : null;

        this.displayValidators.push({
          ...v,
          signatureFinale: finalSignature,
          signatureBase64: signatureBase64
        });
      } else {
        console.log(`➖ Validateur ${i + 1}: placeholder`);
        this.displayValidators.push({
          id: -i - 1,
          demande_id: this.demande!.id,
          user_id: 0,
          statut: 'initial',
          ordre: i + 1,
          user: null,
          signatureFinale: null,
          signatureBase64: null
        });
      }
    }

    console.log('🎯 DisplayValidators final:', this.displayValidators);
    
    const finalValidation = allValidations.find(v => 
      v.statut === 'approuvé' || v.statut === 'rejeté' || v.statut === 'validé'
    );
    this.finalValidatorName = finalValidation?.user?.username || null;
    console.log('🏁 Validateur final:', this.finalValidatorName);
    
    console.groupEnd();
  }

  calculateValidationTours(): void {
    console.group('🔍 DEBUG calculateValidationTours()');
    
    if (!this.demande?.validations) {
      console.log('❌ Aucune validation disponible');
      console.groupEnd();
      return;
    }

    const validations = this.demande.validations.sort((a, b) => a.ordre - b.ordre);
    console.log('📊 Validations pour calcul tours:', validations);
    
    // Trouver le tour actuel (première validation en attente)
    const currentValidation = validations.find(v => v.statut === 'en attente');
    console.log('🎯 Validation en attente trouvée:', currentValidation);
    
    this.currentValidationTour = currentValidation ? currentValidation.ordre : validations.length;
    console.log('🔄 Tour actuel calculé:', this.currentValidationTour);
    
    // Total des tours = nombre maximum d'ordre
    this.totalValidationTours = Math.max(...validations.map(v => v.ordre));
    console.log('📈 Total tours calculé:', this.totalValidationTours);
    
    // Afficher les infos du prochain tour si ce n'est pas le dernier
    this.showNextTourInfo = this.currentValidationTour < this.totalValidationTours && 
                           this.demande.status === 'en attente';
    console.log('ℹ️ Show next tour info:', this.showNextTourInfo);
    
    console.groupEnd();
  }

  isCurrentValidator(validator: DemandeValidation): boolean {
    const isCurrent = validator.statut === 'en attente' && 
                     validator.ordre === this.currentValidationTour &&
                     this.demande?.status === 'en attente';
    
    console.log(`🔍 isCurrentValidator: ${validator.user?.username || 'N/A'}`, {
      statut: validator.statut,
      ordre: validator.ordre,
      tourActuel: this.currentValidationTour,
      statutDemande: this.demande?.status,
      resultat: isCurrent
    });
    
    return isCurrent;
  }

  isValidationCompleted(validator: DemandeValidation): boolean {
    return validator.statut === 'validé' || validator.statut === 'approuvé';
  }

  isValidationPending(validator: DemandeValidation): boolean {
    return validator.statut === 'en attente' && 
           validator.ordre > this.currentValidationTour;
  }

  canValidateCurrentTour(): boolean {
    console.group('🔍 DEBUG canValidateCurrentTour()');
    
    // Condition 1: Demande existe et est en attente
    if (!this.demande) {
      console.log('❌ Échec: Demande est null/undefined');
      console.groupEnd();
      return false;
    }
    
    if (this.demande.status !== 'en attente') {
      console.log('❌ Échec: Statut demande:', this.demande.status, '(attendu: en attente)');
      console.groupEnd();
      return false;
    }
    console.log('✅ Condition 1: Demande existe et statut = "en attente"');

    // Condition 2: Rôle utilisateur
    console.log('👤 Rôle utilisateur:', this.currentUserRole);
    console.log('🆔 ID utilisateur:', this.currentUserId);
    
    if (!(this.currentUserRole === 'rh' || this.currentUserRole === 'daf')) {
      console.log('❌ Échec: Rôle insuffisant. Rôle actuel:', this.currentUserRole);
      console.groupEnd();
      return false;
    }
    console.log('✅ Condition 2: Rôle RH ou DAF');

    // Condition 3: Tour de validation actuel
    console.log('🔄 Tour actuel:', this.currentValidationTour);
    console.log('📊 Validateurs display:', this.displayValidators);
    
    const currentValidator = this.displayValidators.find(v => this.isCurrentValidator(v));
    console.log('🎯 Validateur actuel trouvé:', currentValidator);
    
    if (!currentValidator) {
      console.log('❌ Échec: Aucun validateur trouvé pour le tour actuel');
      console.groupEnd();
      return false;
    }
    console.log('✅ Condition 3: Validateur actuel trouvé');

    // Condition 4: Correspondance ID utilisateur
    console.log('🔍 Comparaison IDs:');
    console.log('   - ID validateur:', currentValidator.user?.id);
    console.log('   - ID utilisateur:', this.currentUserId);
    console.log('   - Types:', typeof currentValidator.user?.id, typeof this.currentUserId);
    
    const canValidate = currentValidator.user?.id === this.currentUserId;
    console.log('✅ Condition 4: IDs correspondent:', canValidate);
    
    if (!canValidate) {
      console.log('❌ Échec: ID utilisateur ne correspond pas au validateur actuel');
      console.log('   - ID validateur:', currentValidator.user?.id, '(type:', typeof currentValidator.user?.id + ')');
      console.log('   - ID utilisateur:', this.currentUserId, '(type:', typeof this.currentUserId + ')');
    }
    
    console.log('🎯 Résultat final canValidateCurrentTour:', canValidate);
    console.groupEnd();
    
    return canValidate;
  }

  // Méthode de test pour vérifier toutes les conditions
  testValidationConditions(): void {
    console.group('🧪 TEST Validation Conditions');
    console.log('Demande:', this.demande);
    console.log('Current User ID:', this.currentUserId);
    console.log('Current User Role:', this.currentUserRole);
    console.log('Current Validation Tour:', this.currentValidationTour);
    console.log('Display Validators:', this.displayValidators);
    console.log('Can Validate Current Tour:', this.canValidateCurrentTour());
    console.groupEnd();
  }

  isLastTour(): boolean {
    return this.currentValidationTour === this.totalValidationTours;
  }

  getValidationProgress(): number {
    if (this.totalValidationTours === 0) return 0;
    return ((this.currentValidationTour - 1) / this.totalValidationTours) * 100;
  }

  getStatusText(): string {
    if (!this.demande) return '';
    
    switch (this.demande.status) {
      case 'approuvée':
        return 'Validée après ' + this.totalValidationTours + ' tour(s)';
      case 'rejetée':
        return 'Rejetée';
      case 'en attente':
        return 'En attente - Tour ' + this.currentValidationTour + '/' + this.totalValidationTours;
      default:
        return this.demande.status;
    }
  }

  getValidatorStatusText(validator: DemandeValidation): string {
    switch (validator.statut) {
      case 'validé':
      case 'approuvé':
        return 'Validé';
      case 'rejeté':
        return 'Rejeté';
      case 'en attente':
        return this.isCurrentValidator(validator) ? 'En cours' : 'En attente';
      case 'initial':
        return 'Non assigné';
      default:
        return validator.statut;
    }
  }

  getFinalValidationDate(): string {
    if (!this.demande?.validations) return '';
    
    const finalValidation = this.demande.validations
      .filter(v => v.statut === 'validé' || v.statut === 'approuvé')
      .sort((a, b) => {
        const dateA = a.date_validation ? new Date(a.date_validation) : new Date(0);
        const dateB = b.date_validation ? new Date(b.date_validation) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })[0];
    
    return finalValidation?.date_validation || '';
  }

  // ACTIONS DE VALIDATION
  validateCurrentTour(): void {
    if (!this.demandeId || !this.canValidateCurrentTour()) {
      console.error('❌ Validation impossible: conditions non remplies');
      this.errorMessage = 'Validation impossible. Vérifiez les conditions.';
      return;
    }

    console.log('✅ Début validation tour pour demande:', this.demandeId);

    this.demandeService.validateCurrentTour(this.demandeId).subscribe({
      next: (response) => {
        console.log('✅ Réponse validation:', response);
        this.successMessage = this.isLastTour() 
          ? 'Demande validée définitivement !' 
          : 'Tour de validation terminé ! Passage au tour suivant.';
        this.loadDemandeDetails(this.demandeId!);
      },
      error: (error) => {
        console.error('❌ Erreur validation:', error);
        this.errorMessage = error.message || 'Erreur lors de la validation du tour.';
      }
    });
  }

  confirmReject(): void {
    if (!this.rejectReason.trim()) {
      this.errorMessage = 'La raison du rejet ne peut pas être vide.';
      return;
    }
    
    this.showRejectModal = false;
    
    if (this.demandeId) {
      console.log('✅ Début rejet tour pour demande:', this.demandeId);
      
      this.demandeService.rejectCurrentTour(this.demandeId, this.rejectReason).subscribe({
        next: (response) => {
          console.log('✅ Réponse rejet:', response);
          this.successMessage = 'Demande rejetée avec succès !';
          this.loadDemandeDetails(this.demandeId!);
        },
        error: (error) => {
          console.error('❌ Erreur rejet:', error);
          this.errorMessage = error.message || 'Erreur lors du rejet.';
        }
      });
    }
  }

  approveDemande(): void {
    // Ancienne méthode remplacée par validateCurrentTour()
    this.validateCurrentTour();
  }

  // MÉTHODES EXISTANTES
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

  editDemande(): void {
    this.router.navigate(['/demandes/edit', this.demandeId]);
  }

  openDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
  }

  confirmDelete(): void {
    this.showDeleteConfirmModal = false;
    if (this.demandeId) {
      this.demandeService.deleteDemande(this.demandeId).subscribe({
        next: () => {
          this.successMessage = 'Demande supprimée avec succès !';
          setTimeout(() => this.router.navigate(['/demandes']), 1500);
        },
        error: () => {
          this.errorMessage = 'Erreur lors de la suppression.';
        }
      });
    }
  }

  openRejectModal(): void {
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  checkLogoExists(): void {
    const img = new Image();
    img.onload = () => {
      this.hasLogo = true;
    };
    img.onerror = () => {
      this.hasLogo = false;
    };
    img.src = '/assets/logo-entreprise.png';
  }

  getImageAsBase64(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async generatePDF() {
    if (!this.demande) return;

    this.successMessage = 'Génération du PDF en cours...';

    try {
      const DATA = document.getElementById('pdf-content');
      if (!DATA) {
        this.errorMessage = 'Élément PDF non trouvé';
        return;
      }

      await this.prepareSignaturesForPDF(DATA);

      const canvas = await html2canvas(DATA, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = this.getPDFFileName();
      pdf.save(fileName);

      this.successMessage = 'PDF généré avec succès !';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      this.errorMessage = 'Erreur lors de la génération du PDF';
    }
  }

  async prepareSignaturesForPDF(pdfElement: HTMLElement): Promise<void> {
    const signatureContainers = pdfElement.querySelectorAll('.signature-container');
    
    for (let i = 0; i < signatureContainers.length; i++) {
      const container = signatureContainers[i] as HTMLElement;
      const validatorIndex = i;
      const validator = this.displayValidators[validatorIndex];
      
      if (validator?.signatureBase64) {
        const imgElements = container.querySelectorAll('img');
        imgElements.forEach((img: HTMLImageElement) => {
          img.src = validator.signatureBase64!;
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

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  navigateToList(): void {
    this.router.navigate(['/demandes']);
  }

  reloadDetails(): void {
    if (this.demandeId) {
      this.loadDemandeDetails(this.demandeId);
    }
  }
}