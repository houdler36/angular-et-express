// src/app/Composante/role-redirect/role-redirect.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-role-redirect',
  standalone: true,
  template: '', // Ce composant n'a pas de vue, il sert uniquement à la redirection
})
export class RoleRedirectComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const userRole = this.authService.getUserRole();
    if (userRole === 'admin') { // Utilisez 'admin' ici, en minuscules, comme dans votre base de données
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
