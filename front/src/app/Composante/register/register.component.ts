import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms'; // Ajout de AbstractControl, ValidatorFn pour une meilleure sécurité de type dans checkPasswords
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule} from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // Initialisez registerForm directement ou dans le constructeur après que fb soit disponible
  registerForm: any; // Ou spécifiez le type FormGroup si vous préférez un typage strict

  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder, // <-- Conservez cette ligne pour injecter FormBuilder
    private authService: AuthService,
    private router: Router
  ) {
    // Initialisez registerForm ici dans le constructeur après que fb ait été injecté
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.checkPasswords });
  }

  // Typez le paramètre 'group' comme AbstractControl pour une meilleure sécurité de type
  checkPasswords: ValidatorFn = (group: AbstractControl): { [key: string]: any } | null => {
    const pass = group.get('password')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { notSame: true };
  };

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    const { username, email, password } = this.registerForm.value;

    this.authService.register(username!, email!, password!).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = err.error.message || "Erreur lors de l'inscription";
        this.isLoading = false;
      }
    });
  }
}