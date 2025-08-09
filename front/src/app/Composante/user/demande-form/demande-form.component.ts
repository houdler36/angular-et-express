import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { of } from 'rxjs';

// Modèle de données pour la demande, basé sur votre structure originale
interface Demande {
  type: 'DED' | 'Recette';
  date: string;
  journal: number | null;
  motif: string;
  respPj: number | null;
  pjStatus: 'oui' | 'pas encore';
  datePj?: string | null;
  details: DemandeDetail[];
}

interface DemandeDetail {
  nature: 'appro' | 'charge' | 'produits' | 'autre';
  beneficiaire: string;
  nifExiste: 'oui' | 'non';
  nif?: string;
  stat?: string;
  libelle: string;
  montant: number;
  numeroCompte?: string;
  codeBudgetaire?: string;
  budgetAnnuel?: number;
  budgetTrimestriel?: number;
}

// Service fictif pour les appels API
class DemandeService {
  submit(demande: Demande) {
    console.log('Envoi de la demande à l\'API:', demande);
    return of({ ...demande, id: Math.floor(Math.random() * 1000) });
  }
}

// Données factices pour les listes déroulantes
const JOURNALS = [{ id_journal: 1, nom_journal: 'Journal de Caisse' }, { id_journal: 2, nom_journal: 'Journal de Banque' }];
const PERSONNES = [{ id: 1, nom: 'Jean Dupont' }, { id: 2, nom: 'Marie Dubois' }];

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

  journals = JOURNALS;
  personnes = PERSONNES;

  private demandeService = new DemandeService();

  constructor(private fb: FormBuilder) {
    // Initialisation du formulaire principal
    this.demandeForm = this.fb.group({
      type: ['DED'],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      journal: [null, Validators.required],
      motif: ['', Validators.required],
      respPj: [null, Validators.required],
      pjStatus: ['oui'],
      datePj: [null],
      details: this.fb.array([this.createDetail()]) // Initialise avec un détail par défaut
    });
  }

  ngOnInit(): void {
    // Souscription pour la validation conditionnelle du champ `datePj`
    this.demandeForm.get('pjStatus')?.valueChanges.subscribe(value => {
      const datePjControl = this.demandeForm.get('datePj');
      if (value === 'pas encore') {
        datePjControl?.setValidators(Validators.required);
      } else {
        datePjControl?.clearValidators();
      }
      datePjControl?.updateValueAndValidity();
    });

    // Souscription pour recalculer le total si un détail est ajouté/supprimé
    this.demandeForm.get('details')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  // Accesseur pour le FormArray des détails
  get details(): FormArray {
    return this.demandeForm.get('details') as FormArray;
  }

  // Crée un nouveau FormGroup pour un détail de la demande
  createDetail(): FormGroup {
    const detailFormGroup = this.fb.group({
      nature: [null, Validators.required],
      beneficiaire: ['', Validators.required],
      nifExiste: ['non'],
      nif: [''],
      stat: [''],
      libelle: ['', Validators.required],
      montant: [0, [Validators.required, Validators.min(0)]],
      numeroCompte: [''],
      codeBudgetaire: [''],
      budgetAnnuel: [{ value: 0, disabled: true }],
      budgetTrimestriel: [{ value: 0, disabled: true }],
    });

    // Gère la validation des champs conditionnels en fonction de la nature
    detailFormGroup.get('nature')?.valueChanges.subscribe(nature => {
      const codeBudgetaireControl = detailFormGroup.get('codeBudgetaire');
      const numeroCompteControl = detailFormGroup.get('numeroCompte');
      
      codeBudgetaireControl?.clearValidators();
      numeroCompteControl?.clearValidators();

      if (nature === 'charge' || nature === 'produits') {
        codeBudgetaireControl?.setValidators(Validators.required);
      } else if (nature === 'appro' || nature === 'autre') {
        numeroCompteControl?.setValidators(Validators.required);
      }
      
      codeBudgetaireControl?.updateValueAndValidity();
      numeroCompteControl?.updateValueAndValidity();
    });

    // Gère la validation des champs NIF/STAT en fonction de `nifExiste`
    detailFormGroup.get('nifExiste')?.valueChanges.subscribe(nifExiste => {
      const nifControl = detailFormGroup.get('nif');
      const statControl = detailFormGroup.get('stat');
      
      nifControl?.clearValidators();
      statControl?.clearValidators();

      if (nifExiste === 'oui') {
        nifControl?.setValidators(Validators.required);
        statControl?.setValidators(Validators.required);
      } else {
        nifControl?.setValue('');
        statControl?.setValue('');
      }

      nifControl?.updateValueAndValidity();
      statControl?.updateValueAndValidity();
    });

    // Simule la récupération du budget lors du changement de `codeBudgetaire`
    detailFormGroup.get('codeBudgetaire')?.valueChanges.subscribe(code => {
      const nature = detailFormGroup.get('nature')?.value;
      if (code && nature && (nature === 'charge' || nature === 'produits')) {
        this.fetchBudgets(detailFormGroup, code);
      }
    });

    return detailFormGroup;
  }

  // Ajoute un nouveau détail au FormArray
  addDetail(): void {
    this.details.push(this.createDetail());
  }

  // Supprime un détail du FormArray
  removeDetail(i: number): void {
    this.details.removeAt(i);
  }

  // Calcule le montant total des détails
  calculateTotal(): void {
    let total = 0;
    this.details.controls.forEach(control => {
      const montantValue = control.get('montant')?.value;
      if (montantValue !== null && montantValue !== undefined) {
        total += parseFloat(montantValue);
      }
    });
    this.totalAmount = total;
  }

  // Simule la récupération des budgets
  fetchBudgets(detailFormGroup: FormGroup, code: string): void {
    console.log(`Simuler la récupération des budgets pour le code: ${code}`);
    // Données factices
    detailFormGroup.get('budgetAnnuel')?.setValue(10000);
    detailFormGroup.get('budgetTrimestriel')?.setValue(2500);
  }

  // Vérifie la validité d'un champ
  isInvalid(controlName: string): boolean | undefined {
    const control = this.demandeForm.get(controlName);
    return control?.invalid && (control?.touched || control?.dirty);
  }

  // Vérifie la validité d'un champ dans un détail
  isDetailInvalid(i: number, controlName: string): boolean | undefined {
    const detailGroup = this.details.at(i);
    const control = detailGroup?.get(controlName);
    return control?.invalid && (control?.touched || control?.dirty);
  }

  onSubmit(): void {
    this.demandeForm.markAllAsTouched();
    this.details.controls.forEach(detail => detail.markAllAsTouched());

    if (this.demandeForm.valid) {
      console.log('Formulaire soumis avec succès:', this.demandeForm.value);
      this.successMessage = 'Demande soumise avec succès !';
      this.errorMessage = null;
      // Ajoutez ici votre logique d'envoi à l'API via le service
      // this.demandeService.submit(this.demandeForm.value).subscribe(...);
    } else {
      this.errorMessage = 'Veuillez remplir correctement tous les champs obligatoires.';
      this.successMessage = null;
      console.error('Le formulaire est invalide.');
    }
  }
}
