// src/app/components/personne-crud/personne-crud.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Personne } from '../../../models/personne';
import { PersonneApiService } from '../../../services/Personne.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-personne',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './personne.component.html',
  styleUrls: ['./personne.component.css']
})
export class PersonneCrudComponent implements OnInit {
  personnes: Personne[] = [];
  personneForm: FormGroup;
  editingPersonne: Personne | null = null;
  showForm = false;
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private fb: FormBuilder, private personneService: PersonneApiService) {
    this.personneForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      poste: ['']
    });
  }

  ngOnInit(): void {
    this.loadPersonnes();
  }

  loadPersonnes(): void {
    this.personneService.getAll().subscribe({
      next: data => this.personnes = data,
      error: err => {
        console.error('Erreur récupération personnes', err);
        this.showToast('Erreur lors du chargement des personnes.', 'error');
      }
    });
  }

  openForm(personne?: Personne): void {
    this.showForm = true;
    if (personne) {
      this.editingPersonne = personne;
      this.personneForm.patchValue(personne);
    } else {
      this.editingPersonne = null;
      this.personneForm.reset();
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.personneForm.reset();
    this.editingPersonne = null;
  }

  submitForm(): void {
    if (this.personneForm.invalid) return;

    const data: Personne = this.personneForm.value;

    if (this.editingPersonne) {
      this.personneService.update(this.editingPersonne.id!, data).subscribe({
        next: () => {
          this.loadPersonnes();
          this.closeForm();
          this.showToast('Personne mise à jour avec succès !', 'success');
        },
        error: () => this.showToast('Erreur lors de la mise à jour.', 'error')
      });
    } else {
      this.personneService.create(data).subscribe({
        next: () => {
          this.loadPersonnes();
          this.closeForm();
          this.showToast('Personne ajoutée avec succès !', 'success');
        },
        error: () => this.showToast('Erreur lors de la création.', 'error')
      });
    }
  }

  deletePersonne(id: number): void {
    this.personneService.delete(id).subscribe({
      next: () => {
        this.loadPersonnes();
        this.showToast('Personne supprimée avec succès !', 'success');
      },
      error: () => this.showToast('Erreur lors de la suppression.', 'error')
    });
  }

  confirmDelete(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette personne ?')) {
      this.deletePersonne(id);
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => this.toastMessage = null, 3000);
  }
}
