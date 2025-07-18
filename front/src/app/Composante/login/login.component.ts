import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
//import { LoadingComponent } from '../loading/loading.component'; // Optionnel

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form = {
    username: '',
    password: ''
  };
  
  showPassword = false;
  isLoggedIn = false;
  isLoginFailed = false;
  isLoading = false; // Pour gérer l'état de chargement
  errorMessage = '';
  roles: string[] = [];

  constructor(
    private authService: AuthService, 
    private tokenStorage: TokenStorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      const user = this.tokenStorage.getUser();
      this.roles = user?.roles || [];
      this.redirectBasedOnRole(user?.role);
    }
  }

  onSubmit(): void {
    this.isLoading = true;
    this.isLoginFailed = false;
    
    this.authService.login(this.form.username, this.form.password).subscribe({
      next: (data) => this.handleLoginSuccess(data),
      error: (err) => this.handleLoginError(err),
      complete: () => this.isLoading = false
    });
  }

  private handleLoginSuccess(data: any): void {
    this.tokenStorage.saveToken(data.accessToken);
    this.tokenStorage.saveUser(data);
    
    this.isLoginFailed = false;
    this.isLoggedIn = true;
    this.roles = data.roles || [];
    
    this.redirectBasedOnRole(data.role);
  }

  private handleLoginError(err: any): void {
    this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la connexion';
    this.isLoginFailed = true;
    this.isLoading = false;
  }

  private redirectBasedOnRole(role?: string): void {
    const route = this.getRouteForRole(role);
    this.router.navigate([route]);
  }

  private getRouteForRole(role?: string): string {
    const roleRoutes: Record<string, string> = {
      'admin': '/admin',
      'user': '/user',
      'rh': '/rh',
      'daf': '/daf',
      'caissier': '/caissier'
    };
    
    return roleRoutes[role?.toLowerCase() || ''] || '/user';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}