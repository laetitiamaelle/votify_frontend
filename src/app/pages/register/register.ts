// ============================================================
// COMMANDE CLI :
// ng generate component pages/register --standalone --skip-tests
//
// RÔLE : Page d'inscription pour les électeurs.
//        Design split-screen :
//        Gauche = fond clair avec argumentaire
//        Droite = formulaire de création de compte
//        Pas d'appel API — visuel uniquement.
// ============================================================
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';


// Interface pour typer les arguments de la page gauche
interface Argument {
  icone: string;
  titre: string;
  description: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {

  // Contrôle la visibilité des mots de passe
  afficherMdp = signal(false);
  afficherMdpConfirm = signal(false);

  // Arguments affichés sur le panneau gauche
  arguments: Argument[] = [
    {
      icone: 'bi-shield-check',
      titre: 'Sécurité de niveau bancaire',
      description: 'Vos votes sont chiffrés de bout en bout et protégés par les protocoles les plus stricts.'
    },
    {
      icone: 'bi-fingerprint',
      titre: 'Anonymat garanti',
      description: 'Le secret du vote est notre priorité absolue. Personne ne peut lier votre identité à votre choix.'
    },
    {
      icone: 'bi-lightning-charge',
      titre: 'Rapidité & Simplicité',
      description: 'Votez en quelques secondes depuis n\'importe quel appareil, sans déplacement inutile.'
    }
  ];

  // Formulaire réactif avec validateur personnalisé
  registerForm: FormGroup;

  constructor(
  private fb: FormBuilder,
  private authService: AuthService,
  private router: Router
) {

  this.registerForm = this.fb.group({
    first_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.required],
    cni: ['', Validators.required],
    
  });

}

  // Raccourcis champs
  get first_name() {
  return this.registerForm.get('first_name')!;
}

get email() {
  return this.registerForm.get('email')!;
}

get telephone() {
  return this.registerForm.get('telephone')!;
}

get cni() {
  return this.registerForm.get('cni')!;
}

get conditions() {
  return this.registerForm.get('conditions')!;
}

  onSubmit(): void {

  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  this.authService.register(this.registerForm.value)
    .subscribe({

      next: (response) => {

        alert(
          'Compte créé avec succès. Vérifiez votre email pour récupérer votre mot de passe.'
        );

        this.router.navigate(['/login']);
      },

      error: (error) => {

  console.log('Status:', error.status);

  console.log('Erreur complète:', error);

  console.log('Réponse backend:', error.error);

}
    });

}
}
