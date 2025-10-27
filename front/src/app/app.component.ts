import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { TokenStorageService } from './services/token-storage.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html', // Point vers le fichier HTML
  styleUrls: ['./app.component.css']    // Point vers le fichier CSS
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SALFA-FRONT';
  currentUser: any;
  isLoggedIn: boolean = false;
  private userSubscription: Subscription | null = null;
  showLogoutDialog: boolean = false; // Variable pour contrôler la visibilité du dialogue

  constructor(
    private authService: AuthService,
    private tokenStorageService: TokenStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log("[AppComponent] ngOnInit called.");
    this.userSubscription = this.tokenStorageService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user && !!user.accessToken;
      console.log("[AppComponent] User state updated via subscription:", this.isLoggedIn, this.currentUser);
    });
    this.currentUser = this.tokenStorageService.getUser();
    this.isLoggedIn = this.tokenStorageService.isLoggedIn();
    console.log("[AppComponent] Initial user state:", this.isLoggedIn, this.currentUser);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      console.log("[AppComponent] User subscription unsubscribed.");
    }
  }

  // Ouvre le dialogue de confirmation
  openLogoutDialog(): void {
    this.showLogoutDialog = true;
  }

  // Gère la réponse de l'utilisateur
  onLogoutConfirm(confirm: boolean): void {
    this.showLogoutDialog = false; // Ferme le dialogue
    if (confirm) {
      console.log("[AppComponent] Logging out...");
      this.authService.logout();
      this.router.navigate(['/login']);
    } else {
      console.log("[AppComponent] Logout annulé.");
    }
  }

  // Gestionnaire d'événements clavier pour le dialogue
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.showLogoutDialog) {
      if (event.key === 'Escape') {
        this.onLogoutConfirm(false); // Annuler avec ESC
      } else if (event.key === 'Enter') {
        this.onLogoutConfirm(true); // Confirmer avec Enter
      }
    }
  }
}
