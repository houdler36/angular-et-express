import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';

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

  users: User[] = [];
  journals: Journal[] = [];

  newUser: any = { username: '', email: '', password: '', role: '', journalIds: [] };
  selectedUser: any = null;

  isEditMode: boolean = false;
  showAddUserModal: boolean = false;
  showConfirmDeleteModal: boolean = false;

  message: string = '';
  isError: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadJournals();
  }

  loadUsers() {
    this.userService.getUsersList().subscribe({
      next: (data) => this.users = data,
      error: () => this.setMessage('Erreur lors du chargement des utilisateurs.', true)
    });
  }

  loadJournals() {
    this.userService.getJournalsList().subscribe({
      next: (data) => this.journals = data,
      error: () => this.setMessage('Erreur lors du chargement des journaux.', true)
    });
  }

  // ---------- MODALES ----------
  openModal(user?: User) {
    this.resetForm();
    if (user) {
      this.isEditMode = true;
      this.selectedUser = user;
      this.newUser.username = user.username;
      this.newUser.email = user.email;
      this.newUser.role = user.role;
      this.newUser.journalIds = user.journals.map(j => j.id_journal);
    }
    this.showAddUserModal = true;
  }

  closeModal() {
    this.showAddUserModal = false;
    this.resetForm();
  }

  confirmDeleteUser(user: User) {
    this.selectedUser = user;
    this.showConfirmDeleteModal = true;
  }

  closeConfirmModal() {
    this.showConfirmDeleteModal = false;
    this.selectedUser = null;
  }

  // ---------- CRUD ----------
  createOrUpdateUser() {
    if (!this.newUser.username || !this.newUser.email || (!this.isEditMode && !this.newUser.password) || !this.newUser.role) {
      this.setMessage('Veuillez remplir tous les champs obligatoires.', true);
      return;
    }

    if (this.isEditMode && this.selectedUser) {
      // Modifier utilisateur
      this.userService.updateAdminUser(this.selectedUser.id, this.newUser).subscribe({
        next: () => {
          this.setMessage('Utilisateur mis à jour avec succès !', false);
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => this.setMessage('Erreur lors de la mise à jour : ' + (err.error?.message || 'Inconnue'), true)
      });
    } else {
      // Créer utilisateur
      this.userService.createAdminUser(this.newUser).subscribe({
        next: () => {
          this.setMessage('Utilisateur créé avec succès !', false);
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => this.setMessage('Erreur lors de la création : ' + (err.error?.message || 'Inconnue'), true)
      });
    }
  }

  deleteUser() {
    if (!this.selectedUser) return;

    this.userService.deleteAdminUser(this.selectedUser.id).subscribe({
      next: () => {
        this.setMessage('Utilisateur supprimé avec succès !', false);
        this.loadUsers();
        this.closeConfirmModal();
      },
      error: (err) => this.setMessage('Erreur lors de la suppression : ' + (err.error?.message || 'Inconnue'), true)
    });
  }

  // ---------- UTILITAIRES ----------
  onJournalChange(event: Event, id_journal: number) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.newUser.journalIds.includes(id_journal)) this.newUser.journalIds.push(id_journal);
    } else {
      const index = this.newUser.journalIds.indexOf(id_journal);
      if (index > -1) this.newUser.journalIds.splice(index, 1);
    }
  }

  resetForm() {
    this.newUser = { username: '', email: '', password: '', role: '', journalIds: [] };
    this.selectedUser = null;
    this.isEditMode = false;
  }

  setMessage(msg: string, error: boolean) {
    this.message = msg;
    this.isError = error;
    setTimeout(() => this.message = '', 5000);
  }

  getJournalNamesForUser(user: User): string {
    return user.journals.map(j => j.nom_journal).join(', ');
  }
}
