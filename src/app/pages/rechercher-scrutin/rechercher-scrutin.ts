// ============================================================
// COMMANDE CLI :
// ng generate component pages/rechercher-scrutin --standalone --skip-tests
//
// RÔLE : Dashboard principal de l'électeur.
//        Permet de rechercher, filtrer et parcourir les scrutins
//        disponibles. Affiche aussi les scrutins populaires et
//        récemment consultés.
//        Responsive — données fictives.
// ============================================================

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StatutScrutin = 'en_cours' | 'a_venir' | 'termine';
type Categorie = 'tous' | 'universites' | 'associations' | 'entreprises' | 'citoyennete';

interface ScrutinPublic {
  id: number;
  titre: string;
  organisation: string;
  orgInitiales: string;
  orgCouleur: string;
  dateFin: string;
  participants: number;
  statut: StatutScrutin;
  // Couleur de fond de la vignette
  couleurVignette: string;
  iconeVignette: string;
  categorie: Categorie;
}

interface ScrutinRecent {
  id: number;
  titre: string;
  organisation: string;
  orgInitiales: string;
  orgCouleur: string;
  statut: string;
}

@Component({
  selector: 'app-rechercher-scrutin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rechercher-scrutin.html',
  styleUrls: ['./rechercher-scrutin.scss']
})
export class RechercherScrutinComponent {

  // Navigation sidebar électeur
  ongletActif = 'rechercher';

  navItems = [
    { label: 'Accueil',            icone: 'bi-house',          route: 'accueil',    actif: false },
    { label: 'Rechercher un scrutin', icone: 'bi-search',      route: 'rechercher', actif: true  },
    { label: 'Mes scrutins',       icone: 'bi-clipboard2-check',route: 'mes-scrutins',actif: false},
    { label: 'Résultats',          icone: 'bi-bar-chart-line',  route: 'resultats',  actif: false },
    { label: 'Profil',             icone: 'bi-person-circle',   route: 'profil',     actif: false },
  ];

  // Filtres
  recherche   = '';
  categorieActive: Categorie = 'tous';
  filtreStatut = 'tous';

  categories: { key: Categorie; label: string }[] = [
    { key: 'tous',         label: 'Tous'          },
    { key: 'universites',  label: 'Universités'   },
    { key: 'associations', label: 'Associations'  },
    { key: 'entreprises',  label: 'Entreprises'   },
    { key: 'citoyennete',  label: 'Citoyenneté'   },
  ];

  filtresStatut = ['Tous les statuts', 'En cours', 'À venir', 'Passés'];

  // Scrutins recommandés (données fictives)
  scrutins: ScrutinPublic[] = [
    {
      id: 1, titre: 'Élection du Bureau des Étudiants 2024',
      organisation: 'Université de Sorbonne', orgInitiales: 'US', orgCouleur: '#4f46e5',
      dateFin: 'Fin le 20/05/2024', participants: 1240,
      statut: 'en_cours', couleurVignette: '#fef3c7',
      iconeVignette: 'bi-people-fill', categorie: 'universites'
    },
    {
      id: 2, titre: 'Nouveau Logo de l\'Association Sportive',
      organisation: 'AS Montparnasse', orgInitiales: 'AS', orgCouleur: '#0891b2',
      dateFin: 'Fin le 15/05/2024', participants: 450,
      statut: 'en_cours', couleurVignette: '#e0f2fe',
      iconeVignette: 'bi-trophy-fill', categorie: 'associations'
    },
    {
      id: 3, titre: 'Budget Participatif — Quartier Sud',
      organisation: 'Mairie de Lyon', orgInitiales: 'ML', orgCouleur: '#16a34a',
      dateFin: 'Fin le 01/06/2024', participants: 0,
      statut: 'a_venir', couleurVignette: '#dcfce7',
      iconeVignette: 'bi-bank2', categorie: 'citoyennete'
    },
    {
      id: 4, titre: 'Représentants du Personnel 2024',
      organisation: 'TechCorp Solutions', orgInitiales: 'TC', orgCouleur: '#374151',
      dateFin: 'Fin le 30/04/2024', participants: 890,
      statut: 'termine', couleurVignette: '#f3f4f6',
      iconeVignette: 'bi-briefcase-fill', categorie: 'entreprises'
    },
    {
      id: 5, titre: 'Concours d\'Architecture Durable',
      organisation: 'Ordre des Architectes', orgInitiales: 'OA', orgCouleur: '#b45309',
      dateFin: 'Fin le 25/05/2024', participants: 320,
      statut: 'en_cours', couleurVignette: '#fef3c7',
      iconeVignette: 'bi-building', categorie: 'associations'
    },
    {
      id: 6, titre: 'Référendum Interne : Télétravail',
      organisation: 'Global Finance Group', orgInitiales: 'GF', orgCouleur: '#7c3aed',
      dateFin: 'Fin le 18/05/2024', participants: 2100,
      statut: 'en_cours', couleurVignette: '#ede9fe',
      iconeVignette: 'bi-house-heart-fill', categorie: 'entreprises'
    },
  ];

  // Scrutins récemment consultés
  scrutinsRecents: ScrutinRecent[] = [
    { id: 3, titre: 'Budget Participatif — Quartier Su...', organisation: 'Mairie de Lyon', orgInitiales: 'ML', orgCouleur: '#16a34a', statut: 'Actif' },
    { id: 4, titre: 'Représentants du Personnel 202...', organisation: 'TechCorp Solutions', orgInitiales: 'TC', orgCouleur: '#374151', statut: 'Actif' },
    { id: 5, titre: 'Concours d\'Architecture Durabl...', organisation: 'Ordre des Architectes', orgInitiales: 'OA', orgCouleur: '#b45309', statut: 'Actif' },
  ];

  // Getter : scrutins filtrés
  get scrutinsFiltres(): ScrutinPublic[] {
    return this.scrutins.filter(s => {
      const matchCategorie = this.categorieActive === 'tous' || s.categorie === this.categorieActive;
      const matchRecherche = !this.recherche.trim() ||
        s.titre.toLowerCase().includes(this.recherche.toLowerCase()) ||
        s.organisation.toLowerCase().includes(this.recherche.toLowerCase());
      const matchStatut =
        this.filtreStatut === 'Tous les statuts' ||
        (this.filtreStatut === 'En cours'  && s.statut === 'en_cours') ||
        (this.filtreStatut === 'À venir'   && s.statut === 'a_venir')  ||
        (this.filtreStatut === 'Passés'    && s.statut === 'termine');
      return matchCategorie && matchRecherche && matchStatut;
    });
  }

  setCategorie(cat: Categorie): void { this.categorieActive = cat; }
  setFiltreStatut(f: string): void { this.filtreStatut = f; }
  setOnglet(route: string): void {
    this.ongletActif = route;
    this.navItems.forEach(item => item.actif = item.route === route);
  }

  getLibelleStatut(statut: StatutScrutin): string {
    return { en_cours: 'En cours', a_venir: 'À venir', termine: 'Terminé' }[statut];
  }

  getLibelleBouton(statut: StatutScrutin): string {
    return { en_cours: 'Voter maintenant', a_venir: 'M\'inscrire', termine: 'Voir les résultats' }[statut];
  }
}
