// Fichier: src/app/components/user-management/user-management.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';

// Interfaces
interface Journal {
  id_journal: number;
  nom_journal: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  journals: Journal[];
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {

  showAddUserModal = false;

  newUser: any = {
    username: '',
    email: '',
    password: '',
    role: '',
    journalIds: []
  };

  journals: Journal[] = [];
  users: User[] = [];

  message: string = '';
  isError: boolean = false;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadJournals();
    this.loadUsers();
  }

  // --- API ---
  loadJournals(): void {
    this.userService.getJournalsList().subscribe({
      next: data => this.journals = data,
      error: err => this.setMessage('Erreur lors du chargement des journaux.', true)
    });
  }

  loadUsers(): void {
    this.userService.getUsersList().subscribe({
      next: data => this.users = data,
      error: err => this.setMessage('Erreur lors du chargement des utilisateurs.', true)
    });
  }

  createUser(): void {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password || !this.newUser.role) {
      this.setMessage('Veuillez remplir tous les champs obligatoires.', true);
      return;
    }

    this.userService.createAdminUser(this.newUser).subscribe({
      next: res => {
        this.setMessage('Utilisateur créé avec succès !', false);
        this.loadUsers();
        this.resetForm();
        this.closeModal();
      },
      error: err => this.setMessage('Erreur lors de la création : ' + (err.error?.message || 'Inconnue'), true)
    });
  }

  // --- Gestion des journaux sélectionnés ---
  onJournalChange(event: Event, id_journal: number): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!this.newUser.journalIds.includes(id_journal)) this.newUser.journalIds.push(id_journal);
    } else {
      const index = this.newUser.journalIds.indexOf(id_journal);
      if (index > -1) this.newUser.journalIds.splice(index, 1);
    }
  }

  // --- Utilitaires ---
  resetForm(): void {
    this.newUser = { username: '', email: '', password: '', role: '', journalIds: [] };
    this.message = '';
    this.isError = false;
  }

  setMessage(message: string, isError: boolean): void {
    this.message = message;
    this.isError = isError;
    setTimeout(() => this.message = '', 5000);
  }

  getJournalNamesForUser(user: User): string {
    return user.journals.map(j => j.nom_journal).join(', ');
  }

  // --- Modale ---
  openModal(): void {
    this.resetForm();
    this.showAddUserModal = true;
  }

  closeModal(): void {
    this.showAddUserModal = false;
  }
}
