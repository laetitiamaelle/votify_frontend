// ============================================================
// COMMANDE CLI :
// ng generate component pages/candidats --standalone --skip-tests
//
// RÔLE : Page de gestion des candidats d'un scrutin.
//        Affiche les candidats sous forme de cartes avec
//        photo, parti, poste, description et boutons d'action.
//        Responsive — données fictives.
// ============================================================

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Candidat {
  id: number;
  nom: string;
  parti: string;
  poste: string;
  description: string;
  // Couleur de fond de l'avatar (simulée)
  couleurAvatar: string;
  // Initiales pour l'avatar
  initiales: string;
}

@Component({
  selector: 'app-candidats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidats.html',
  styleUrls: ['./candidats.scss']
})
export class CandidatsComponent {

  // Onglet actif sidebar
  ongletActif = 'candidats';

  navItems = [
    { label: 'Tableau de bord', icone: 'bi-grid-1x2-fill',   route: 'dashboard',    actif: false },
    { label: 'Mes scrutins',    icone: 'bi-clipboard2-check', route: 'scrutins',     actif: false },
    { label: 'Candidats',       icone: 'bi-people',           route: 'candidats',    actif: true  },
    { label: 'Inscriptions',    icone: 'bi-person-plus',      route: 'inscriptions', actif: false },
    { label: 'Résultats',       icone: 'bi-bar-chart-line',   route: 'resultats',    actif: false },
    { label: 'Profil',          icone: 'bi-person-circle',    route: 'profil',       actif: false },
  ];

  // Statistiques en haut
  totalCandidats     = 24;
  inscriptionsValides = 18;
  enAttente          = 6;
  scrutinsActifs     = 3;

  // Terme de recherche
  recherche = '';

  // Données fictives des candidats
  tousLesCandidats: Candidat[] = [
    {
      id: 1, nom: 'Alice Marchal', parti: 'Campus Vert',
      poste: 'PRÉSIDENTE — ASSOCIATION ÉTUDIANTE',
      description: 'Engagée pour une vie de campus plus dynamique et durable. 3 ans d\'expérience dans la gestion associative.',
      couleurAvatar: '#4f46e5', initiales: 'AM'
    },
    {
      id: 2, nom: 'Thomas Dubois', parti: 'Avenir Tech',
      poste: 'TRÉSORIER — FACULTÉ DES SCIENCES',
      description: 'Expert en gestion budgétaire et transparence financière. Propose une numérisation des processus.',
      couleurAvatar: '#0891b2', initiales: 'TD'
    },
    {
      id: 3, nom: 'Sarah Benali', parti: 'Droit pour Tous',
      poste: 'DÉLÉGUÉE — MASTER DROIT',
      description: 'Représentante active des étudiants auprès de l\'administration. Focus sur l\'accessibilité.',
      couleurAvatar: '#be185d', initiales: 'SB'
    },
    {
      id: 4, nom: 'Marc Lefebvre', parti: 'Sport Unifié',
      poste: 'SECRÉTAIRE — CLUB DE SPORT',
      description: 'Ancien sportif de haut niveau souhaitant promouvoir l\'inclusion par le sport et le bien-être.',
      couleurAvatar: '#b45309', initiales: 'ML'
    },
    {
      id: 5, nom: 'Léa Girard', parti: 'Ensemble',
      poste: 'VICE-PRÉSIDENTE — BDE',
      description: 'Passionnée par l\'événementiel et le bien-être étudiant. Co-fondatrice de deux associations.',
      couleurAvatar: '#7c3aed', initiales: 'LG'
    },
    {
      id: 6, nom: 'Julien Morel', parti: 'Vision Recherche',
      poste: 'REPRÉSENTANT — DOCTORANTS',
      description: 'Chercheur en intelligence artificielle. Travaille sur l\'amélioration des ressources pour doctorants.',
      couleurAvatar: '#065f46', initiales: 'JM'
    },
  ];

  // Getter : filtre les candidats selon la recherche
  get candidatsFiltres(): Candidat[] {
    if (!this.recherche.trim()) return this.tousLesCandidats;
    const terme = this.recherche.toLowerCase();
    return this.tousLesCandidats.filter(c =>
      c.nom.toLowerCase().includes(terme) ||
      c.poste.toLowerCase().includes(terme) ||
      c.parti.toLowerCase().includes(terme)
    );
  }

  setOnglet(route: string): void {
    this.ongletActif = route;
    this.navItems.forEach(item => item.actif = item.route === route);
  }

  // Simulation suppression
  supprimerCandidat(id: number): void {
    const index = this.tousLesCandidats.findIndex(c => c.id === id);
    if (index > -1) this.tousLesCandidats.splice(index, 1);
  }

  // Simulation modification
  modifierCandidat(id: number): void {
    console.log('Modifier candidat :', id);
    // TODO: Ouvrir modal ou naviguer vers page édition
  }
}
