// ============================================================
// COMMANDE CLI :
// ng generate component pages/demande-admin --standalone --skip-tests
//
// RÔLE : Formulaire de demande de compte administrateur.
//        S'ouvre quand l'utilisateur clique sur
//        "Demander un compte administrateur" depuis l'accueil.
// ============================================================

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DemandeAdminService } from '../../services/demande-admin';

@Component({
  selector: 'app-demande-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './demande-admin.html',
  styleUrls: ['./demande-admin.scss']
})
export class DemandeAdminComponent {

  // Signal pour afficher un message de succès après envoi
  envoye = signal(false);

  // Formulaire réactif avec tous les champs de la maquette
  demandeForm: FormGroup;

  constructor(private fb: FormBuilder, private demandeAdminService: DemandeAdminService) {
    this.demandeForm = this.fb.group({
      nom:          ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],
      telephone:    ['', Validators.required],
      cni:          ['', Validators.required],
      organisation: ['', Validators.required],
      motif:        ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  // Raccourcis pour accéder aux champs dans le HTML
  get nom()          { return this.demandeForm.get('nom')!;          }
  get email()        { return this.demandeForm.get('email')!;        }
  get telephone()    { return this.demandeForm.get('telephone')!;    }
  get cni()          { return this.demandeForm.get('cni')!;          }
  get organisation() { return this.demandeForm.get('organisation')!; }
  get motif()        { return this.demandeForm.get('motif')!;        }

  // Soumission du formulaire
 onSubmit(): void {

  if (this.demandeForm.invalid) {
    this.demandeForm.markAllAsTouched();
    return;
  }

  console.log("Données envoyées :", this.demandeForm.value);

  this.demandeAdminService.creerDemande(this.demandeForm.value)
    .subscribe({
      next: (response) => {
        console.log("Réponse backend :", response);
        this.envoye.set(true);
      },
      error: (err: any) => {
        console.error(err);
      }
    });
}

  // Réinitialiser le formulaire
  nouvelleDemandeq(): void {
    this.demandeForm.reset();
    this.envoye.set(false);
  }
}