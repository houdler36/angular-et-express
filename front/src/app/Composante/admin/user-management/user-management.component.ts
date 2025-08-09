// Fichier: C:\Users\WINDOWS 10\Desktop\Houlder\front\src\app\components\user-management\user-management.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service'; // Correction de l'import : Utilisation de UserService

// Définition des interfaces
interface Journal {
 id_journal: number; // Correction: le nom de la colonne est id_journal
 nom_journal: string; // Correction: le nom de la colonne est nom_journal
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

 // Initialisation de l'objet newUser avec journalIds comme tableau vide
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

 constructor(
  private userService: UserService // Correction: Utilisation de UserService
 ) { }

 ngOnInit(): void {
  this.loadJournals();
  this.loadUsers();
 }

 // --- Méthodes API ---

 loadJournals(): void {
  this.userService.getJournalsList().subscribe({ // Correction: Utilisation de la méthode getJournalsList()
   next: data => {
    this.journals = data;
   },
   error: err => {
    console.error('Erreur lors du chargement des journaux :', err);
    this.setMessage('Erreur lors du chargement des journaux.', true);
   }
  });
 }

 loadUsers(): void {
  this.userService.getUsersList().subscribe({
   next: data => {
    this.users = data;
   },
   error: err => {
    console.error('Erreur lors du chargement des utilisateurs :', err);
    this.setMessage('Erreur lors du chargement des utilisateurs.', true);
   }
  });
 }

 createUser(): void {
  this.userService.createAdminUser(this.newUser).subscribe({
   next: res => {
    console.log('Réponse du back-end :', res);
    this.setMessage('Utilisateur créé avec succès !', false);
    this.loadUsers();
    this.resetForm();
   },
   error: err => {
    console.error('Erreur lors de la création de l\'utilisateur :', err);
    this.setMessage('Erreur lors de la création de l\'utilisateur : ' + err.error.message, true);
   }
  });
 }

 // --- Fonctions utilitaires ---

 onJournalChange(event: Event, id_journal: number): void { // Correction: le nom de la variable est id_journal
  const isChecked = (event.target as HTMLInputElement).checked;
  if (isChecked) {
   if (!this.newUser.journalIds.includes(id_journal)) { // Correction: le nom de la variable est id_journal
    this.newUser.journalIds.push(id_journal); // Correction: le nom de la variable est id_journal
   }
  } else {
   const index = this.newUser.journalIds.indexOf(id_journal); // Correction: le nom de la variable est id_journal
   if (index > -1) {
    this.newUser.journalIds.splice(index, 1);
   }
  }
 }

 resetForm(): void {
  this.newUser = {
   username: '',
   email: '',
   password: '',
   role: '',
   journalIds: []
  };
  this.message = '';
  this.isError = false;
 }

 setMessage(message: string, isError: boolean): void {
  this.message = message;
  this.isError = isError;
  setTimeout(() => {
   this.message = '';
  }, 5000);
 }

 getJournalNamesForUser(user: User): string {
  const journalNames = user.journals.map(journal => journal.nom_journal); // Correction: le nom de la propriété est nom_journal
  return journalNames.join(', ');
 }
}
