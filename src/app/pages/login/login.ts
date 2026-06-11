import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {

  afficherMotDePasse = signal(false);
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],
      remember: [false]
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  toggleMotDePasse(): void {
    this.afficherMotDePasse.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Récupération des valeurs du formulaire { email, password }
    const credentials = this.loginForm.value;

    console.log('Données envoyées à Django :', credentials);

    this.authService.login(credentials).subscribe({
      next: (response: any) => {
        console.log('Réponse de Django JWT :', response);

        // 1. Sauvegarde des tokens dans le localStorage
        if (response.access) {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          localStorage.setItem('user_email', credentials.email);
        }

        // 2. Extraction de l'utilisateur
        const user = response?.user;

        // Si SimpleJWT ne renvoie pas l'objet user, on redirige vers l'espace électeur par défaut
        if (!user) {
          console.warn("Django JWT ne renvoie pas d'objet 'user' par défaut. Redirection standard vers l'espace électeur.");
          this.router.navigate(['/electeur']);
          return;
        }

        // 3. Redirections basées sur tes vraies routes d'app.routes.ts
        if (user.is_superuser) {
          this.router.navigate(['/dashboard']); // Route Superadmin
        } else if (user.role === 'admin') {
          this.router.navigate(['/admin']);     // Route Admin Dashboard
        } else if (user.role === 'electeur') {
          this.router.navigate(['/electeur']);  // Route Explorer les scrutins
        }
      },
      error: (error) => {
        console.error('Erreur brute renvoyée par Django :', error);
        console.log('Détail du refus de Django :', JSON.stringify(error.error));
        alert('Email ou mot de passe incorrect.');
      }
    });
  }
}