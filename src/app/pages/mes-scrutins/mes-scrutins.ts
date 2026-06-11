// ============================================================
// COMMANDE CLI :
// ng generate component pages/mes-scrutins --standalone --skip-tests
//
// RÔLE : Page listant les scrutins auxquels l'électeur est
//        inscrit ou a participé. Avec filtres et statuts.
// ============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type StatutInscription = 'vote' | 'inscrit' | 'en_cours' | 'termine';

interface MonScrutin {
  id: number;
  titre: string;
  organisation: string;
  orgInitiales: string;
  orgCouleur: string;
  dateFin: string;
  statut: StatutInscription;
  participation?: number;
  totalElecteurs?: number;
  aVote: boolean;
}

@Component({
  selector: 'app-mes-scrutins',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mes-scrutins.html',
  styleUrls: ['./mes-scrutins.scss']
})
export class MesScrutinsComponent {

  ongletActif = 'mes-scrutins';
  filtreActif = 'tous';

  navItems = [
    { label: 'Accueil',               icone: 'bi-house',           route: 'accueil',     actif: false },
    { label: 'Rechercher un scrutin',  icone: 'bi-search',          route: 'rechercher',  actif: false },
    { label: 'Mes scrutins',           icone: 'bi-clipboard2-check',route: 'mes-scrutins',actif: true  },
    { label: 'Résultats',              icone: 'bi-bar-chart-line',  route: 'resultats',   actif: false },
    { label: 'Profil',                 icone: 'bi-person-circle',   route: 'profil',      actif: false },
  ];

  filtres = [
    { key: 'tous',     label: 'Tous'         },
    { key: 'en_cours', label: 'En cours'     },
    { key: 'vote',     label: 'Votés'        },
    { key: 'termine',  label: 'Terminés'     },
    { key: 'inscrit',  label: 'Inscrits'     },
  ];

  mesScrutins: MonScrutin[] = [
    { id: 1, titre: 'Élection du Bureau des Étudiants 2024', organisation: 'Université de Sorbonne', orgInitiales: 'US', orgCouleur: '#4f46e5', dateFin: 'Fin le 20/05/2024', statut: 'vote', participation: 1240, totalElecteurs: 2800, aVote: true },
    { id: 2, titre: 'Nouveau Logo de l\'Association Sportive', organisation: 'AS Montparnasse', orgInitiales: 'AS', orgCouleur: '#0891b2', dateFin: 'Fin le 15/05/2024', statut: 'en_cours', participation: 450, totalElecteurs: 1200, aVote: false },
    { id: 3, titre: 'Budget Participatif — Quartier Sud', organisation: 'Mairie de Lyon', orgInitiales: 'ML', orgCouleur: '#16a34a', dateFin: 'Fin le 01/06/2024', statut: 'inscrit', aVote: false },
    { id: 4, titre: 'Représentants du Personnel 2024', organisation: 'TechCorp Solutions', orgInitiales: 'TC', orgCouleur: '#374151', dateFin: 'Fin le 30/04/2024', statut: 'termine', participation: 890, totalElecteurs: 1000, aVote: true },
    { id: 5, titre: 'Référendum Interne : Télétravail', organisation: 'Global Finance Group', orgInitiales: 'GF', orgCouleur: '#7c3aed', dateFin: 'Fin le 18/05/2024', statut: 'vote', participation: 2100, totalElecteurs: 2500, aVote: true },
  ];

  get scrutinsFiltres(): MonScrutin[] {
    if (this.filtreActif === 'tous') return this.mesScrutins;
    return this.mesScrutins.filter(s => s.statut === this.filtreActif);
  }

  setFiltreActif(key: string): void { this.filtreActif = key; }
  setOnglet(route: string): void {
    this.ongletActif = route;
    this.navItems.forEach(i => i.actif = i.route === route);
  }

  getLibelleStatut(s: StatutInscription): string {
    return { vote: 'Voté', inscrit: 'Inscrit', en_cours: 'En cours', termine: 'Terminé' }[s];
  }

  getBoutonLabel(s: MonScrutin): string {
    if (s.aVote) return 'Voir mon vote';
    if (s.statut === 'en_cours') return 'Voter maintenant';
    if (s.statut === 'inscrit') return 'En attente';
    return 'Voir les résultats';
  }
}
