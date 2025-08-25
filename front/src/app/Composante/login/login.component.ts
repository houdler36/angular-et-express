import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { TokenStorageService } from '../../services/token-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: any = {
    username: '',
    password: ''
  };

  showPassword = false;
  isLoggedIn = false;
  isLoginFailed = false;
  isLoading = false;
  errorMessage = '';
  roles: string[] = [];

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    if (this.tokenStorage.getToken()) {
      const user = this.tokenStorage.getUser();
      this.roles = user?.role ? [user.role.toLowerCase()] : [];
      this.isLoggedIn = this.roles.length > 0;

      if (this.isLoggedIn) {
        // Délai pour permettre l'animation
        setTimeout(() => {
          this.redirectBasedOnUserRoles(this.roles);
        }, 2000);
      }
    }
  }

  onSubmit(): void {
    this.isLoading = true;
    this.isLoginFailed = false;
    this.errorMessage = '';

    this.authService.login(this.form.username, this.form.password).subscribe({
      next: (data) => {
        this.handleLoginSuccess(data);
      },
      error: (err) => {
        this.handleLoginError(err);
      }
    });
  }

  private handleLoginSuccess(data: any): void {
    this.tokenStorage.saveToken(data.accessToken);
    this.tokenStorage.saveUser(data);

    this.isLoginFailed = false;
    this.isLoading = false;

    const userRoleFromBackend = data.role;
    this.roles = userRoleFromBackend ? [userRoleFromBackend.toLowerCase()] : [];
    this.isLoggedIn = this.roles.length > 0;

    this.redirectBasedOnUserRoles(this.roles);
  }

  private handleLoginError(err: any): void {
    this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
    this.isLoginFailed = true;
    this.isLoading = false;
  }

  private redirectBasedOnUserRoles(roles: string[]): void {
    let targetRoute = '/dashboard';

    if (roles.includes('admin')) {
      targetRoute = '/admin';
    } else if (roles.includes('rh')) {
      targetRoute = '/rh/dashboard';
    } else if (roles.includes('daf')) {
  targetRoute = '/daf/dashboard';
}
 else if (roles.includes('caissier')) {
      targetRoute = '/caissier-dashboard';
    }

    this.ngZone.run(() => {
      this.router.navigate([targetRoute]);
    });
  }

  togglePasswordVisibility(): void {
    if (this.isLoading) return;
    this.showPassword = !this.showPassword;
  }
}