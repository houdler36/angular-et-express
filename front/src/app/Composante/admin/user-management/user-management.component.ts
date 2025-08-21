import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  journals: Journal[];
  signature_image_url?: string;
}

interface Journal {
  id_journal: number;
  nom_journal: string;
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

  selectedFile: File | null = null;
  signatureImageUrl: string | ArrayBuffer | null = null;

  constructor(private userService: UserService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadJournals();
  }

  loadUsers() {
    this.userService.getUsersList().subscribe({
      next: data => this.users = data,
      error: () => this.setMessage('Erreur lors du chargement des utilisateurs.', true)
    });
  }

  loadJournals() {
    this.userService.getJournalsList().subscribe({
      next: data => this.journals = data,
      error: () => this.setMessage('Erreur lors du chargement des journaux.', true)
    });
  }

  openModal(user?: User) {
    this.resetForm();
    if (user) {
      this.isEditMode = true;
      this.selectedUser = user;
      this.newUser.username = user.username;
      this.newUser.email = user.email;
      this.newUser.role = user.role;
      this.newUser.journalIds = user.journals.map(j => j.id_journal);
      if (user.signature_image_url) this.signatureImageUrl = user.signature_image_url;
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.previewSignature();
    } else {
      this.selectedFile = null;
      this.signatureImageUrl = null;
    }
  }

  previewSignature() {
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => this.signatureImageUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

private uploadSignature(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!this.selectedFile) {
      resolve(null);
      return;
    }

    const formData = new FormData();
    formData.append('signature', this.selectedFile);

    // Headers JWT si nécessaire
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    this.http.post<any>('http://localhost:8081/api/upload-signature', formData, { headers })
      .subscribe({
        next: res => resolve(res.url),
        error: err => reject(err)
      });
  });
}


  async createOrUpdateUser() {
    if (!this.newUser.username || !this.newUser.email || (!this.isEditMode && !this.newUser.password) || !this.newUser.role) {
      this.setMessage('Veuillez remplir tous les champs obligatoires.', true);
      return;
    }

    let signatureUrl: string | null = null;
    if (this.newUser.role === 'rh' && this.selectedFile) {
      try {
        signatureUrl = await this.uploadSignature();
      } catch (error) {
        this.setMessage('Erreur lors de l\'upload de la signature.', true);
        console.error(error);
        return;
      }
    } else if (this.isEditMode && this.selectedUser?.signature_image_url && !this.selectedFile) {
      signatureUrl = this.selectedUser.signature_image_url;
    }

    const userPayload = {
      ...this.newUser,
      signature_image_url: signatureUrl
    };

    if (this.isEditMode && this.selectedUser) {
      this.userService.updateAdminUser(this.selectedUser.id, userPayload).subscribe({
        next: () => {
          this.setMessage('Utilisateur mis à jour avec succès !', false);
          this.loadUsers();
          this.closeModal();
        },
        error: err => this.setMessage('Erreur lors de la mise à jour : ' + (err.error?.message || 'Inconnue'), true)
      });
    } else {
      this.userService.createAdminUser(userPayload).subscribe({
        next: () => {
          this.setMessage('Utilisateur créé avec succès !', false);
          this.loadUsers();
          this.closeModal();
        },
        error: err => this.setMessage('Erreur lors de la création : ' + (err.error?.message || 'Inconnue'), true)
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
      error: err => this.setMessage('Erreur lors de la suppression : ' + (err.error?.message || 'Inconnue'), true)
    });
  }

  onJournalChange(event: Event, id_journal: number) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.newUser.journalIds.includes(id_journal)) this.newUser.journalIds.push(id_journal);
    } else {
      this.newUser.journalIds = this.newUser.journalIds.filter((id: number) => id !== id_journal);
    }
  }

  resetForm() {
    this.newUser = { username: '', email: '', password: '', role: '', journalIds: [] };
    this.selectedUser = null;
    this.isEditMode = false;
    this.selectedFile = null;
    this.signatureImageUrl = null;
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
