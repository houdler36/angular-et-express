import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { TokenStorageService } from './services/token-storage.service';
import { Subscription } from 'rxjs'; // Assurez-vous que cette ligne est bien là

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SALFA-FRONT';
  currentUser: any;
  isLoggedIn: boolean = false;
  // Correction ici : Initialisez userSubscription à null
  private userSubscription: Subscription | null = null; // <--- MODIFICATION ICI (Ajout de | null = null)

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
    // La vérification `if (this.userSubscription)` est toujours valide avec `null`
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      console.log("[AppComponent] User subscription unsubscribed.");
    }
  }

  logout(): void {
    console.log("[AppComponent] Logging out...");
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}