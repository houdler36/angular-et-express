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

  searchTerm: string = '';
  isLoading: boolean = false;
  isLoadingJournals: boolean = false;
  isSaving: boolean = false;

  constructor(private userService: UserService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadJournals();
  }

  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    return this.users.filter(user =>
      user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.getUsersList().subscribe({
      next: data => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => {
        this.setMessage('Erreur lors du chargement des utilisateurs.', true);
        this.isLoading = false;
      }
    });
  }

  loadJournals() {
    this.isLoadingJournals = true;
    this.userService.getJournalsList().subscribe({
      next: data => {
        this.journals = data;
        this.isLoadingJournals = false;
      },
      error: () => {
        this.setMessage('Erreur lors du chargement des journaux.', true);
        this.isLoadingJournals = false;
      }
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


 // ... (le reste du code du composant) ...

async createOrUpdateUser() {
    if (!this.newUser.username || !this.newUser.email || (!this.isEditMode && !this.newUser.password) || !this.newUser.role) {
      this.setMessage('Veuillez remplir tous les champs obligatoires.', true);
      return;
    }

    this.isSaving = true;

    let signatureUrl: string | null = null;
    // La condition ici est mise à jour pour inclure le rôle 'daf'
    if ((this.newUser.role === 'rh' || this.newUser.role === 'daf') && this.selectedFile) {
      try {
        signatureUrl = await this.uploadSignature();
      } catch (error) {
        this.setMessage('Erreur lors de l\'upload de la signature.', true);
        console.error(error);
        this.isSaving = false;
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
          this.isSaving = false;
        },
        error: err => {
          this.setMessage('Erreur lors de la mise à jour : ' + (err.error?.message || 'Inconnue'), true);
          this.isSaving = false;
        }
      });
    } else {
      this.userService.createAdminUser(userPayload).subscribe({
        next: () => {
          this.setMessage('Utilisateur créé avec succès !', false);
          this.loadUsers();
          this.closeModal();
          this.isSaving = false;
        },
        error: err => {
          this.setMessage('Erreur lors de la création : ' + (err.error?.message || 'Inconnue'), true);
          this.isSaving = false;
        }
      });
    }
  }

// ... (le reste du code du composant) ...
  deleteUser() {
    if (!this.selectedUser) return;

    this.isSaving = true;

    this.userService.deleteAdminUser(this.selectedUser.id).subscribe({
      next: () => {
        this.setMessage('Utilisateur supprimé avec succès !', false);
        this.loadUsers();
        this.closeConfirmModal();
        this.isSaving = false;
      },
      error: err => {
        this.setMessage('Erreur lors de la suppression : ' + (err.error?.message || 'Inconnue'), true);
        this.isSaving = false;
      }
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

  getRoleDisplay(role: string): string {
    const roleMap: { [key: string]: string } = {
      'daf': 'DG',
      'user': 'utilisateur',
      'rh': 'valideur',
      'admin': 'admin'
    };
    return roleMap[role] || role;
  }
}
