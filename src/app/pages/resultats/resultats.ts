// ============================================================
// COMMANDE CLI :
// ng generate component pages/resultats --standalone --skip-tests
//
// RÔLE : Page des résultats d'un scrutin pour l'électeur.
//        Affiche les résultats sous forme de barres de progression,
//        statistiques de participation et podium des candidats.
//        Responsive — données fictives.
// ============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ResultatCandidat {
  id: number;
  nom: string;
  parti: string;
  initiales: string;
  couleur: string;
  nbVotes: number;
  pourcentage: number;
  estGagnant: boolean;
}

interface StatResultat {
  label: string;
  valeur: string;
  icone: string;
}

@Component({
  selector: 'app-resultats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultats.html',
  styleUrls: ['./resultats.scss']
})
export class ResultatsComponent {

  ongletActif = 'resultats';

  navItems = [
    { label: 'Accueil',               icone: 'bi-house',            route: 'accueil',     actif: false },
    { label: 'Rechercher un scrutin', icone: 'bi-search',           route: 'rechercher',  actif: false },
    { label: 'Mes scrutins',          icone: 'bi-clipboard2-check', route: 'mes-scrutins',actif: false },
    { label: 'Résultats',             icone: 'bi-bar-chart-line',   route: 'resultats',   actif: true  },
    { label: 'Profil',                icone: 'bi-person-circle',    route: 'profil',      actif: false },
  ];

  // Infos du scrutin
  scrutin = {
    titre: 'Élection du Bureau des Étudiants 2024',
    organisation: 'Université de Sorbonne',
    orgInitiales: 'US',
    orgCouleur: '#4f46e5',
    dateDebut: '01/05/2024',
    dateFin:   '20/05/2024',
    statut:    'Terminé',
    totalInscrits:  2800,
    totalVotants:   1240,
    tauxParticipation: 44.3,
    bulletinsBlancs: 12,
  };

  // Statistiques résumées
  stats: StatResultat[] = [
    { label: 'Inscrits',        valeur: '2 800',  icone: 'bi-people'         },
    { label: 'Votes exprimés',  valeur: '1 240',  icone: 'bi-check2-circle'  },
    { label: 'Participation',   valeur: '44.3%',  icone: 'bi-graph-up-arrow' },
    { label: 'Bulletins blancs',valeur: '12',     icone: 'bi-file-earmark'   },
  ];

  // Résultats par candidat (triés par votes décroissants)
  candidats: ResultatCandidat[] = [
    { id: 1, nom: 'Alice Marchal',  parti: 'Campus Vert',     initiales: 'AM', couleur: '#4f46e5', nbVotes: 487, pourcentage: 39.3, estGagnant: true  },
    { id: 2, nom: 'Thomas Dubois',  parti: 'Avenir Tech',     initiales: 'TD', couleur: '#0891b2', nbVotes: 362, pourcentage: 29.2, estGagnant: false },
    { id: 3, nom: 'Sarah Benali',   parti: 'Droit pour Tous', initiales: 'SB', couleur: '#be185d', nbVotes: 241, pourcentage: 19.4, estGagnant: false },
    { id: 4, nom: 'Léa Girard',     parti: 'Ensemble',        initiales: 'LG', couleur: '#7c3aed', nbVotes: 150, pourcentage: 12.1, estGagnant: false },
  ];

  // Scrutins récents (navigation rapide)
  scrutinsRecents = [
    { titre: 'Budget Participatif — Quartier Sud', organisation: 'Mairie de Lyon',      initiales: 'ML', couleur: '#16a34a' },
    { titre: 'Représentants du Personnel 2024',    organisation: 'TechCorp Solutions',  initiales: 'TC', couleur: '#374151' },
    { titre: 'Référendum Interne : Télétravail',   organisation: 'Global Finance Group',initiales: 'GF', couleur: '#7c3aed' },
  ];

  setOnglet(route: string): void {
    this.ongletActif = route;
    this.navItems.forEach(i => i.actif = i.route === route);
  }

  // Calcule la largeur de la barre de progression
  getLargeurBarre(pourcentage: number): string {
    return `${pourcentage}%`;
  }

  // Retourne la médaille selon la position
  getMedaille(index: number): string {
    return ['🥇', '🥈', '🥉', ''][index] ?? '';
  }
}
