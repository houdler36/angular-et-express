import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DemandeService } from '../../../services/demande.service';
import { TokenStorageService } from '../../../services/token-storage.service';

@Component({
  selector: 'app-demande-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './demande-form.component.html',
  styleUrls: ['./demande-form.component.css']
})
export class DemandeFormComponent implements OnInit {
  demandeForm: FormGroup;
  totalAmount = 0;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  showModal = false;

  journals: any[] = [];
  personnes: any[] = [];
  budgetsParJournal: any[] = [];
  currentUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private tokenStorageService: TokenStorageService
  ) {
    this.demandeForm = this.fb.group({
      type: ['DED'],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      journal_id: [null, Validators.required],
      description: ['', Validators.required], // <-- CORRECTION ICI
      resp_pj_id: [null, Validators.required],
      pj_status: ['oui'],
      expected_justification_date: [null],
      details: this.fb.array([this.createDetail()])
    });
  }

  ngOnInit(): void {
    const user = this.tokenStorageService.getUser();
    if (user && user.id) {
      this.currentUserId = user.id;
    }

    this.demandeService.getJournals().subscribe({
      next: (data: any[]) => this.journals = data,
      error: err => console.error('Erreur lors de la récupération des journaux', err)
    });

    this.demandeService.getPersonnes().subscribe({
      next: (data: any[]) => this.personnes = data,
      error: err => console.error('Erreur lors de la récupération des personnes', err)
    });

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

    this.demandeForm.get('details')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });

    this.demandeForm.get('journal_id')?.valueChanges.subscribe(journalId => {
      this.onJournalChange(journalId);
    });
  }

  get details(): FormArray {
    return this.demandeForm.get('details') as FormArray;
  }

  createDetail(): FormGroup {
    const detailFormGroup = this.fb.group({
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
      quarterly_budget: [{ value: 0, disabled: true }],
    });

    detailFormGroup.get('budget_id')?.valueChanges.subscribe(budgetId => {
      const selectedBudget = this.budgetsParJournal.find(b => b.id_budget === budgetId);
      if (selectedBudget) {
        detailFormGroup.get('annual_budget')?.setValue(selectedBudget.budget_annuel);
        detailFormGroup.get('quarterly_budget')?.setValue(selectedBudget.budget_trimestre_1);
      } else {
        detailFormGroup.get('annual_budget')?.setValue(0);
        detailFormGroup.get('quarterly_budget')?.setValue(0);
      }
    });

    detailFormGroup.get('nature')?.valueChanges.subscribe(nature => {
      const budgetIdControl = detailFormGroup.get('budget_id');
      const numeroCompteControl = detailFormGroup.get('numero_compte');
      const annualBudgetControl = detailFormGroup.get('annual_budget');
      const quarterlyBudgetControl = detailFormGroup.get('quarterly_budget');

      budgetIdControl?.clearValidators();
      numeroCompteControl?.clearValidators();
      budgetIdControl?.setValue(null);
      numeroCompteControl?.setValue(null);
      annualBudgetControl?.setValue(0);
      quarterlyBudgetControl?.setValue(0);

      if (nature === 'charge' || nature === 'produits') {
        budgetIdControl?.setValidators(Validators.required);
      } else if (nature === 'appro' || nature === 'autre') {
        numeroCompteControl?.setValidators(Validators.required);
      }
      budgetIdControl?.updateValueAndValidity();
      numeroCompteControl?.updateValueAndValidity();
    });

    detailFormGroup.get('nif_exists')?.valueChanges.subscribe(value => {
      const nifControl = detailFormGroup.get('nif');
      const statControl = detailFormGroup.get('stat');
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
      statControl?.updateValueAndValidity();
    });

    return detailFormGroup;
  }

  addDetail(): void {
    this.details.push(this.createDetail());
  }

  removeDetail(index: number): void {
    this.details.removeAt(index);
  }

  calculateTotal(): void {
    let total = 0;
    this.details.controls.forEach(control => {
      const value = control.get('amount')?.value;
      if (value !== null && value !== undefined && !isNaN(value)) {
        total += parseFloat(value);
      }
    });
    this.totalAmount = total;
  }

  isInvalid(controlName: string): boolean | undefined {
    const control = this.demandeForm.get(controlName);
    return control?.invalid && (control?.touched || control?.dirty);
  }

  isDetailInvalid(index: number, controlName: string): boolean | undefined {
    const detailGroup = this.details.at(index);
    const control = detailGroup?.get(controlName);
    return control?.invalid && (control?.touched || control?.dirty);
  }

  onJournalChange(journalId: number): void {
    if (journalId) {
      this.demandeService.getBudgetsByJournalId(journalId).subscribe({
        next: (data: any[]) => {
          this.budgetsParJournal = data;
          this.details.clear();
          this.addDetail();
        },
        error: err => {
          console.error('Erreur lors de la récupération des budgets', err);
          this.budgetsParJournal = [];
        }
      });
    } else {
      this.budgetsParJournal = [];
    }
  }

  onSubmit(): void {
    this.demandeForm.markAllAsTouched();
    this.details.controls.forEach(detail => detail.markAllAsTouched());

    if (this.demandeForm.valid) {
      const dataToSend = {
        userId: this.currentUserId,
        ...this.demandeForm.value,
        montant_total: this.totalAmount
      };

      console.log('Objet demande en cours d\'envoi:', dataToSend);

      this.demandeService.createDemande(dataToSend).subscribe({
        next: () => {
          this.successMessage = 'Demande soumise avec succès !';
          this.errorMessage = null;
          this.showModal = true;
          this.resetForm();
        },
        error: err => {
          console.error('Erreur lors de la soumission :', err);
          this.errorMessage = err.message || 'Une erreur est survenue lors de la soumission.';
          this.successMessage = null;
          this.showModal = true;
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir correctement tous les champs obligatoires.';
      this.successMessage = null;
      this.showModal = true;
      console.error('Formulaire invalide');
    }
  }

  resetForm(): void {
    this.demandeForm.reset({
      type: 'DED',
      date: new Date().toISOString().substring(0, 10),
      pj_status: 'oui',
    });
    this.details.clear();
    this.addDetail();
    this.totalAmount = 0;
  }

  closeModal(): void {
    this.showModal = false;
    this.successMessage = null;
    this.errorMessage = null;
  }
}