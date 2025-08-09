import { Component, OnInit, NgZone } from '@angular/core'; // Importez NgZone
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { TokenStorageService } from '../../services/token-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
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
  isLoading = false;
  errorMessage = '';
  roles: string[] = [];

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private ngZone: NgZone // Injectez NgZone pour la synchronisation si nécessaire
  ) { }

  ngOnInit(): void {
    console.log("[LoginComponent] ngOnInit called.");
    if (this.tokenStorage.getToken()) {
      const user = this.tokenStorage.getUser();
      this.roles = user?.role ? [user.role.toLowerCase()] : [];
      this.isLoggedIn = this.roles.length > 0;

      if (this.isLoggedIn) {
        console.log("[LoginComponent] Token found in storage. User roles (from storage):", this.roles);
        this.redirectBasedOnUserRoles(this.roles);
      } else {
        console.log("[LoginComponent] Token found, but no valid user role. Assuming not fully logged in.");
      }
    } else {
      console.log("[LoginComponent] No token found in storage. User not considered logged in.");
      this.isLoggedIn = false;
    }
  }

  onSubmit(): void {
    this.isLoading = true;
    this.isLoginFailed = false;
    this.errorMessage = '';

    console.log(`[LoginComponent] Attempting login for username: ${this.form.username}`);

    this.authService.login(this.form.username, this.form.password).subscribe({
      next: (data) => {
        console.log("[LoginComponent] Login successful. Raw response data:", data);
        this.handleLoginSuccess(data);
      },
      error: (err) => {
        console.error("[LoginComponent] Login error:", err);
        this.handleLoginError(err);
      },
      complete: () => {
        console.log("[LoginComponent] Login request completed.");
        this.isLoading = false;
      }
    });
  }

  private handleLoginSuccess(data: any): void {
    console.log("[LoginComponent] Handling login success logic...");
    this.tokenStorage.saveToken(data.accessToken);
    this.tokenStorage.saveUser(data);

    this.isLoginFailed = false;
    
    const userRoleFromBackend = data.role;
    this.roles = userRoleFromBackend ? [userRoleFromBackend.toLowerCase()] : [];
    this.isLoggedIn = this.roles.length > 0;

    console.log("[LoginComponent] User data saved. Redirecting based on roles (from backend response):", this.roles);
    this.redirectBasedOnUserRoles(this.roles);
  }

  private handleLoginError(err: any): void {
    console.log("[LoginComponent] Handling login error logic...");
    this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
    this.isLoginFailed = true;
    this.isLoading = false;
  }

  private redirectBasedOnUserRoles(roles: string[]): void {
    let targetRoute = '/dashboard';

    if (roles.includes('admin')) {
      targetRoute = '/admin'; // Changement ici pour correspondre à routes.ts
    } else if (roles.includes('rh')) {
      targetRoute = '/rh-dashboard';
    } else if (roles.includes('daf')) {
      targetRoute = '/daf-dashboard';
    } else if (roles.includes('caissier')) {
      targetRoute = '/caissier-dashboard';
    }

    console.log(`[LoginComponent] Final redirect target route: ${targetRoute}`);
    
    this.ngZone.run(() => {
      this.router.navigate([targetRoute]);
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
