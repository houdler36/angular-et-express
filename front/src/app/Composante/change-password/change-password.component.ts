import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { catchError, switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('popupAnimation', [
      transition(':enter', [
        animate('400ms ease-out', keyframes([
          style({ transform: 'scale(0.7)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.05)', opacity: 1, offset: 0.7 }),
          style({ transform: 'scale(1)', opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class ChangePasswordComponent implements OnInit {
  passwordForm!: FormGroup;
  isCurrentUser = true;
  userId: number | null = null;
  message: string | null = null;
  isError = false;
  showSignatureField = false;
  selectedFile: File | null = null;
  showPopup = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.userId = +id;
        this.isCurrentUser = false;
      }
    });

    const userRole = this.authService.getUserRole();
    if (userRole === 'rh' || userRole === 'daf') {
      this.showSignatureField = true;
    }

    this.initForm();
  }

  initForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', this.isCurrentUser ? Validators.required : null],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.isError = true;
      this.message = 'Veuillez remplir correctement tous les champs.';
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.value;

    let mainObservable = this.isCurrentUser
      ? this.authService.changePassword({ currentPassword, newPassword })
      : this.authService.adminChangePassword(this.userId!, newPassword);

    if (this.selectedFile) {
      mainObservable = mainObservable.pipe(
        switchMap(() => this.userService.uploadSignature(this.selectedFile!).pipe(
          switchMap(uploadRes =>
            this.userService.updateUserProfile({ signature_image_url: uploadRes.url })
          )
        ))
      );
    }

    mainObservable.pipe(
      catchError(err => {
        this.isError = true;
        this.message = err.message || 'Une erreur est survenue lors des mises à jour.';
        return throwError(() => err);
      })
    ).subscribe(() => {
      this.isError = false;
      this.message = null;
      this.passwordForm.reset();
      this.showPopup = true;
    });
  }

  closePopup(): void {
    this.showPopup = false;
  }
}
