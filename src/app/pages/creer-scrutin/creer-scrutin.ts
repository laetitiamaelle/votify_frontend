// ============================================================
// COMMANDE CLI :
// ng generate component pages/creer-scrutin --standalone --skip-tests
//
// RÔLE : Formulaire de création d'un nouveau scrutin.
//        Accessible depuis le dashboard administrateur.
//        Inclut : titre, description, dates, type de visibilité.
//        Responsive — pas d'appel API.
// ============================================================

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Type de visibilité du scrutin
type TypeVisibilite = 'public' | 'prive';

@Component({
  selector: 'app-creer-scrutin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creer-scrutin.html',
  styleUrls: ['./creer-scrutin.scss']
})
export class CreerScrutinComponent {

  // Visibilité sélectionnée (public par défaut comme dans la maquette)
  visibilite = signal<TypeVisibilite>('public');

  // Onglet actif de la sidebar
  ongletActif = 'scrutins';

  navItems = [
    { label: 'Tableau de bord', icone: 'bi-grid-1x2-fill',   route: 'dashboard',    actif: false },
    { label: 'Mes scrutins',    icone: 'bi-clipboard2-check', route: 'scrutins',     actif: true  },
    { label: 'Candidats',       icone: 'bi-people',           route: 'candidats',    actif: false },
    { label: 'Résultats',       icone: 'bi-bar-chart-line',   route: 'resultats',    actif: false },
    { label: 'Paramètres',      icone: 'bi-gear-fill',        route: 'parametres',   actif: false },
  ];

  // Formulaire réactif
  scrutinForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.scrutinForm = this.fb.group({
      titre:       ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.required],
      dateDebut:   ['', Validators.required],
      dateFin:     ['', Validators.required],
    });
  }

  // Raccourcis champs
  get titre()       { return this.scrutinForm.get('titre')!;       }
  get description() { return this.scrutinForm.get('description')!; }
  get dateDebut()   { return this.scrutinForm.get('dateDebut')!;   }
  get dateFin()     { return this.scrutinForm.get('dateFin')!;     }

  // Sélectionner la visibilité
  setVisibilite(type: TypeVisibilite): void {
    this.visibilite.set(type);
  }

  // Changer l'onglet sidebar
  setOnglet(route: string): void {
    this.ongletActif = route;
    this.navItems.forEach(item => item.actif = item.route === route);
  }

  // Soumission
  onSubmit(): void {
    if (this.scrutinForm.invalid) {
      this.scrutinForm.markAllAsTouched();
      return;
    }
    console.log('Scrutin créé :', {
      ...this.scrutinForm.value,
      visibilite: this.visibilite()
    });
    // TODO: Appel API Django POST /api/scrutins/
  }
}
