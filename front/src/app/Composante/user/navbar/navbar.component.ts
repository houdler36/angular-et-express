// src/app/Composante/user/navbar/navbar.component.ts

import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // Importez RouterModule ici
import { CommonModule } from '@angular/common'; // Importez CommonModule

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true, // Si vous utilisez des composants standalone, sinon retirez cette ligne
  imports: [RouterModule, CommonModule] // Ajoutez RouterModule et CommonModule aux imports si standalone
})
export class NavbarComponent {

  constructor(private router: Router) { }

  logout(): void {
    console.log('Déconnexion...');
    // Logique de déconnexion : supprimer le token JWT et rediriger
    localStorage.removeItem('authToken'); // Assurez-vous que c'est bien la clé de votre token
    this.router.navigate(['/login']); // Redirige vers la page de connexion
  }
}