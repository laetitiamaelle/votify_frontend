import { Routes } from '@angular/router';

export const routes: Routes = [
  // Page d'accueil
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home')
        .then(m => m.HomeComponent),
    title: 'Votify — Vote électronique sécurisé'
  },

  // Connexion
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login')
        .then(m => m.LoginComponent),
    title: 'Connexion — Votify'
  },

  // Inscription électeur
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register')
        .then(m => m.RegisterComponent),
    title: 'Créer un compte — Votify'
  },

  // Demande compte administrateur
  {
    path: 'demande-admin',
    loadComponent: () =>
      import('./pages/demande-admin/demande-admin')
        .then(m => m.DemandeAdminComponent),
    title: 'Demande administrateur — Votify'
  },

  // Dashboard superadmin
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard')
        .then(m => m.DashboardComponent),
    title: 'Tableau de bord Superadmin — Votify'
  },

  // Dashboard administrateur
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard')
        .then(m => m.AdminDashboardComponent),
    title: 'Tableau de bord Admin — Votify'
  },
{
    path: 'admin/creer-scrutin',
    loadComponent: () =>
      import('./pages/creer-scrutin/creer-scrutin')
        .then(m => m.CreerScrutinComponent),
    title: 'Créer un scrutin — Votify'
  },
  {
    path: 'admin/candidats',
    loadComponent: () =>
      import('./pages/candidats/candidats')
        .then(m => m.CandidatsComponent),
    title: 'Gestion candidats — Votify'
  },

  // ── Électeur ─────────────────────────────────────────
  {
    path: 'electeur',
    loadComponent: () =>
      import('./pages/electeur-dashboard/electeur-dashboard')
        .then(m => m.ElecteurDashboardComponent),
    title: 'Explorer les scrutins — Votify'
  },
  {
    path: 'electeur/mes-scrutins',
    loadComponent: () =>
      import('./pages/mes-scrutins/mes-scrutins')
        .then(m => m.MesScrutinsComponent),
    title: 'Mes scrutins — Votify'
  },
  {
    path: 'electeur/resultats',
    loadComponent: () =>
      import('./pages/resultats/resultats')
        .then(m => m.ResultatsComponent),
    title: 'Résultats — Votify'
  },
  {
    path: 'electeur/detail-scrutin',
    loadComponent: () =>
      import('./pages/detail-scrutin/detail-scrutin')
        .then(m => m.DetailScrutinComponent),
    title: 'Détail scrutin — Votify'
  },
  // ── Fallback ─────────────────────────────────────────
  { path: '**', redirectTo: '' }
];