import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DemandeService } from '../../../services/demande.service';
import { TokenStorageService } from '../../../services/token-storage.service';

/**
 * Composant pour la création d'une demande (DED, Recette, ERD).
 * Il gère la logique du formulaire, les validations et l'interaction avec les services.
 */
@Component({
  selector: 'app-demande-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,DecimalPipe],
  templateUrl: './demande-form.component.html',
  styleUrls: ['./demande-form.component.css']
})
export class DemandeFormComponent implements OnInit {
  // Le groupe de formulaire principala
  demandeForm: FormGroup;
  // Montant total calculé à partir des détails
  totalAmount = 0;
  // Messages pour le modal de succès ou d'erreur
  successMessage: string | null = null;
  errorMessage: string | null = null;
  // Contrôle l'affichage du modal
  showModal = false;
  // Données du récapitulatif pour affichage dans le modal
  recapData: any;
  // ID du journal actuellement sélectionné pour éviter les rechargements inutiles
  private _journalId: number | null = null;

  // Données pour les listes déroulantes (simulées ici, à remplacer par un service réel)
  journals: any[] = [];
  personnes: any[] = [];
  budgetsParJournal: any[] = [];
  currentUserId: number | null = null;

  // Mode édition
  isEditMode = false;
  editDemandeId: number | null = null;

  // Méthode pour fermer le modal
  closeModal(): void {
    this.showModal = false;
    this.successMessage = null;
    this.errorMessage = null;
  }

  constructor(
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private tokenStorageService: TokenStorageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Fonction pour obtenir la date et l'heure locales actuelles au format YYYY-MM-DDTHH:MM
    const getCurrentLocalDateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Initialisation du formulaire avec des valeurs par défaut et des validateurs
    this.demandeForm = this.fb.group({
      type: ['DED'], // Type de demande par défaut
      date: [getCurrentLocalDateTime(), Validators.required],
      journal_id: [null, Validators.required],
      description: ['', Validators.required],
      resp_pj_id: [null, Validators.required],
      pj_status: ['oui'],
      expected_justification_date: [null], // Validé conditionnellement
      details: this.fb.array([this.createDetail()]), // Crée le premier groupe de détails
      dedId: [null] // ID de la DED d'origine (pour les ERD)
    });
  }

  ngOnInit(): void {
    // Récupérer l'ID de l'utilisateur actuel
    const user = this.tokenStorageService.getUser();
    if (user && user.id) this.currentUserId = user.id;

    // Vérifier si on est en mode édition
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.isEditMode = true;
      this.editDemandeId = +idFromRoute;
      this.loadDemandeForEdit(this.editDemandeId);
    }

    // S'abonner aux query params pour récupérer les données de la demande précédente (si une ERD est créée)
    this.route.queryParams.subscribe(params => {
      // PatchValue met à jour les champs du formulaire avec les valeurs reçues
      if (params['type']) {
        this.demandeForm.patchValue({ type: params['type'] });
        // Si c'est un ERD, désactiver le budget_id du premier détail
        if (params['type'] === 'ERD' && this.details.length > 0) {
          const firstDetail = this.details.at(0);
          firstDetail.get('budget_id')?.disable();
          firstDetail.get('budget_id')?.clearValidators();
          firstDetail.get('budget_id')?.updateValueAndValidity();
        }
      }
      if (params['description']) this.demandeForm.patchValue({ description: params['description'] });
      if (params['journalId']) {
        const journalId = +params['journalId'];
        this.demandeForm.patchValue({ journal_id: journalId });
        this._journalId = journalId;
      }
      if (params['respPJId']) this.demandeForm.patchValue({ resp_pj_id: +params['respPJId'] });

      if (params['montant']) {
        const montant = parseFloat(params['montant']);
        if (this.details.length === 0) {
          this.addDetail();
        }
        this.details.at(0).patchValue({ amount: montant });
        for (let i = 1; i < this.details.length; i++) {
          this.details.at(i).patchValue({ amount: 0 });
        }
        setTimeout(() => this.calculateTotal(), 0);
      }
      if (params['dedId']) this.demandeForm.patchValue({ dedId: +params['dedId'] });
    });

    // Chargement des données pour les listes déroulantes
    this.demandeService.getJournals().subscribe({
      next: (data: any[]) => this.journals = data,
      error: err => console.error('Erreur lors de la récupération des journaux', err)
    });

    this.demandeService.getPersonnes().subscribe({
      next: (data: any[]) => this.personnes = data,
      error: err => console.error('Erreur lors de la récupération des personnes', err)
    });

    // Gère la validation du champ `expected_justification_date` en fonction du statut de la PJ
    this.demandeForm.get('pj_status')?.valueChanges.subscribe(value => {
      const control = this.demandeForm.get('expected_justification_date');
      if (value === 'pas encore') {
        control?.setValidators(Validators.required);
      } else {
        control?.clearValidators();
        control?.setValue(null);
      }
      control?.updateValueAndValidity();
    });

    // Recalcule le montant total à chaque changement de valeur dans les détails
    this.demandeForm.get('details')?.valueChanges.subscribe(() => this.calculateTotal());

    // Recharger les budgets quand le journal change
    this.demandeForm.get('journal_id')?.valueChanges.subscribe(journalId => {
      this.onJournalChange(journalId);
    });
  }

  // Permet d'accéder facilement au FormArray 'details'
  get details(): FormArray {
    return this.demandeForm.get('details') as FormArray;
  }

  /**
   * Crée un nouveau groupe de formulaire pour un détail de la demande.
   */
  createDetail(): FormGroup {
    const fg = this.fb.group({
      nature: [null, Validators.required],
      beneficiaire: ['', Validators.required],
      nif_exists: ['non'],
      nif: [''],
      stat: [''],
      libelle: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      numero_compte: [''],
      budget_id: [null],
      annual_budget: [{ value: 0, disabled: true }],
      quarterly_budget: [{ value: 0, disabled: true }]
    });

    // Gère la validation conditionnelle pour le NIF et le STAT
    fg.get('nif_exists')?.valueChanges.subscribe(value => {
      const nifControl = fg.get('nif');
      const statControl = fg.get('stat');
      if (value === 'oui') {
        nifControl?.setValidators(Validators.required);
        statControl?.setValidators(Validators.required);
      } else {
        nifControl?.clearValidators();
        statControl?.clearValidators();
        nifControl?.setValue('');
        statControl?.setValue('');
      }
      nifControl?.updateValueAndValidity();
    });

    // Écouteur pour le changement de sélection du budget
    fg.get('budget_id')?.valueChanges.subscribe(budgetId => {
      const selectedBudget = this.budgetsParJournal.find(b => b.id_budget === budgetId);
      if (selectedBudget) {
        fg.patchValue({
          annual_budget: selectedBudget.budget_annuel,
          quarterly_budget: selectedBudget.budget_trimestriel
        });
      } else {
        fg.patchValue({
          annual_budget: 0,
          quarterly_budget: 0
        });
      }
    });

    return fg;
  }

  /**
   * Ajoute un nouveau groupe de détail au FormArray.
   */
  addDetail(): void {
    const newDetail = this.createDetail();
    const newDetailIndex = this.details.length;
    
    this.details.push(newDetail);

    // Logique spécifique pour les ERD
    if (this.demandeForm.get('type')?.value === 'ERD') {
      const firstDetail = this.details.at(0);
      
      // Désactiver le budget pour le premier détail (index 0)
      firstDetail.get('budget_id')?.disable();

      // Ajouter les validateurs et écouteurs uniquement pour les détails suivants (index > 0)
      if (newDetailIndex > 0) {
        newDetail.get('nature')?.valueChanges.subscribe(nature => {
          const budgetControl = newDetail.get('budget_id');
          if (nature === 'charge' || nature === 'produits') {
            budgetControl?.enable();
            budgetControl?.setValidators(Validators.required);
          } else {
            budgetControl?.disable();
            budgetControl?.clearValidators();
          }
          budgetControl?.updateValueAndValidity();
        });
      }
    }
  }

  /**
   * Supprime un groupe de détail du FormArray.
   */
  removeDetail(index: number): void {
    this.details.removeAt(index);
    this.calculateTotal();
  }

  /**
   * Calcule le montant total de la demande.
   */
  calculateTotal(): void {
    if (this.details.length === 0) {
      this.totalAmount = 0;
      return;
    }
    const typeDemande = this.demandeForm.get('type')?.value;
    if (typeDemande === 'ERD') {
      const first = parseFloat(this.details.at(0).get('amount')?.value) || 0;
      let sumOthers = 0;
      for (let i = 1; i < this.details.length; i++) {
        sumOthers += parseFloat(this.details.at(i).get('amount')?.value) || 0;
      }
      this.totalAmount = first - sumOthers;
    } else {
      this.totalAmount = this.details.controls.reduce((acc, d) => acc + (parseFloat(d.get('amount')?.value) || 0), 0);
    }
  }

  /**
   * Construit un objet récapitulatif de la demande pour l'affichage.
   */
  getDemandeRecap(): any {
    const recap: any = {
      type: this.demandeForm.get('type')?.value,
      date: this.demandeForm.get('date')?.value,
      description: this.demandeForm.get('description')?.value,
      journal: this.journals.find(j => j.id_journal === this.demandeForm.get('journal_id')?.value)?.nom_journal || 'N/A',
      respPj: this.personnes.find(p => p.id === this.demandeForm.get('resp_pj_id')?.value)?.nom || 'N/A',
      pjStatus: this.demandeForm.get('pj_status')?.value,
      expectedJustificationDate: this.demandeForm.get('expected_justification_date')?.value,
      details: this.details.value.map((d: any) => ({
        nature: d.nature,
        beneficiaire: d.beneficiaire,
        libelle: d.libelle,
        amount: d.amount,
        budgetCode: this.budgetsParJournal.find(b => b.id_budget === d.budget_id)?.code_budget || 'N/A'
      })),
      totalAmount: this.totalAmount
    };
    return recap;
  }

  /**
   * Vérifie si un contrôle du formulaire principal est invalide.
   */
  isInvalid(controlName: string): boolean | undefined {
    const c = this.demandeForm.get(controlName);
    return c?.invalid && (c?.touched || c?.dirty);
  }

  /**
   * Vérifie si un contrôle d'un détail est invalide.
   */
  isDetailInvalid(index: number, controlName: string): boolean | undefined {
    const detail = this.details.at(index);
    const c = detail?.get(controlName);
    return c?.invalid && (c?.touched || c?.dirty);
  }

  /**
   * Gère le changement de journal pour recharger les budgets correspondants.
   */
  onJournalChange(journalId: number): void {
    if (this._journalId === journalId) {
      return;
    }
    this._journalId = journalId;

    if (!journalId) {
      this.budgetsParJournal = [];
      return;
    }
    this.demandeService.getBudgetsByJournalId(journalId).subscribe({
      next: data => {
        this.budgetsParJournal = data;
        // ⭐ Corrigé : Ne pas effacer les détails existants.
        // this.details.clear();
        // this.addDetail();
      },
      error: err => {
        console.error('Erreur lors de la récupération des budgets', err);
        this.budgetsParJournal = [];
      }
    });
  }

  /**
   * Gère la soumission du formulaire.
   */
  onSubmit(): void {
    this.demandeForm.markAllAsTouched();
    this.details.controls.forEach(d => d.markAllAsTouched());

    const typeDemande = this.demandeForm.get('type')?.value;
    let isFormValid = this.demandeForm.valid;

    if (typeDemande !== 'ERD') {
      this.calculateTotal();
      isFormValid = isFormValid && this.totalAmount === this.details.controls.reduce((acc, d) => acc + (parseFloat(d.get('amount')?.value) || 0), 0);
    }

    if (isFormValid) {
      const dataToSend = {
        userId: this.currentUserId,
        ...this.demandeForm.value,
        montant_total: this.totalAmount
      };

      if (this.isEditMode && this.editDemandeId) {
        // Mode édition : mettre à jour la demande
        this.demandeService.updateDemande(this.editDemandeId, dataToSend).subscribe({
          next: () => {
            this.successMessage = 'Demande mise à jour avec succès !';
            this.errorMessage = null;
            this.showModal = true;
            // Rediriger vers la liste des demandes après mise à jour
            setTimeout(() => this.router.navigate(['/demandes']), 2000);
          },
          error: (err: any) => {
            this.errorMessage = err.message || 'Une erreur est survenue lors de la mise à jour.';
            this.successMessage = null;
            this.showModal = true;
          }
        });
      } else {
        // Mode création : créer une nouvelle demande
        this.demandeService.createDemande(dataToSend).subscribe({
          next: () => {
            this.successMessage = 'Demande soumise avec succès !';
            this.errorMessage = null;
            this.showModal = true;

            const dedId = this.demandeForm.get('dedId')?.value;
            if (dedId) {
              this.demandeService.updateDedStatus(dedId, 'oui').subscribe({
                next: () => {
                  console.log('Statut DED mis à jour');
                },
                error: (err: any) => {
                  console.error('Erreur lors de la mise à jour du statut DED', err);
                }
              });
            }
          },
          error: (err: any) => {
            this.errorMessage = err.message || 'Une erreur est survenue lors de la soumission.';
            this.successMessage = null;
            this.showModal = true;
          }
        });
      }
    }
  }

  /**
   * Réinitialise le formulaire à son état initial.
   */
  resetForm(): void {
    // Fonction pour obtenir la date et l'heure locales actuelles au format YYYY-MM-DDTHH:MM
    const getCurrentLocalDateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    this.demandeForm.reset({
      type: 'DED',
      date: getCurrentLocalDateTime(),
      pj_status: 'oui',
      dedId: null
    });
    this.details.clear();
    this.addDetail();
    this.totalAmount = 0;
  }

  /**
   * Charge les données de la demande pour l'édition.
   */
  loadDemandeForEdit(demandeId: number): void {
    this.demandeService.getDemandeById(demandeId).subscribe({
      next: (demande: any) => {
        // Remplir le formulaire avec les données existantes
        this.demandeForm.patchValue({
          type: demande.type,
          date: demande.date,
          journal_id: demande.journal_id,
          description: demande.description,
          resp_pj_id: demande.resp_pj_id,
          pj_status: demande.pj_status,
          expected_justification_date: demande.expected_justification_date,
          dedId: demande.dedId
        });

        // Charger les détails
        this.details.clear();
        demande.details.forEach((detail: any) => {
          const detailForm = this.createDetail();
          detailForm.patchValue(detail);
          this.details.push(detailForm);
        });

        // Calculer le total
        this.calculateTotal();

        // Charger les budgets pour le journal
        if (demande.journal_id) {
          this.onJournalChange(demande.journal_id);
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement de la demande', err);
        this.errorMessage = 'Erreur lors du chargement de la demande.';
        this.showModal = true;
      }
    });
  }
}
