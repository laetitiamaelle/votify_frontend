// ============================================================
// src/app/pages/detail-scrutin/detail-scrutin.component.ts
// Composant détail scrutin — connecté au backend Django/DRF
// Utilisé par l'électeur ET l'admin (via admin-dashboard)
// ============================================================

import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  VotifyService,
  ScrutinAPI,
  CandidatAPI,
  ResultatScrutin,
} from '../../services/votify.service';

interface Timeline {
  date: string;
  label: string;
  fait: boolean;
  actif: boolean;
}

@Component({
  selector: 'app-detail-scrutin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-scrutin.html',
  styleUrls: ['./detail-scrutin.scss']
})
export class DetailScrutinComponent implements OnInit {

  /** ID du scrutin passé en @Input depuis un composant parent
   *  ou récupéré depuis la route si utilisé standalone */
  @Input() scrutinId?: number;

  private svc = inject(VotifyService);

  sidebarOuverte = false;
  ongletActif    = 'mes-scrutins';
  chargement     = true;
  erreur: string | null = null;

  navItems = [
    { label: 'Accueil',               icone: 'bi-house',            route: 'accueil',      actif: false },
    { label: 'Rechercher un scrutin', icone: 'bi-search',           route: 'rechercher',   actif: false },
    { label: 'Mes scrutins',          icone: 'bi-clipboard2-check', route: 'mes-scrutins', actif: true  },
    { label: 'Résultats',             icone: 'bi-bar-chart-line',   route: 'resultats',    actif: false },
    { label: 'Profil',                icone: 'bi-person-circle',    route: 'profil',       actif: false },
  ];

  // ── Données ───────────────────────────────────────────────
  scrutin: ScrutinAPI | null = null;
  candidats: CandidatAPI[]   = [];
  resultats: ResultatScrutin | null = null;
  utilisateurAVote           = false;

  // ── Propriété manquante demandée par le HTML ──────────────
  get stats() {
    return [
      { label: 'Candidats', valeur: this.candidats.length, icone: 'bi-people' },
      { label: 'Votes exprimés', valeur: this.totalVotes, icone: 'bi-ballot' },
      { label: 'Participation', valeur: `${this.tauxParticipation}%`, icone: 'bi-graph-up' },
      { label: 'Statut', valeur: this.libelleStatut, icone: 'bi-info-circle' }
    ];
  }

  // ── Champs calculés ajustés et sécurisés ───────────────────
  get statut() { return this.scrutin ? VotifyService.getStatut(this.scrutin) : 'brouillon'; }
  
  get libelleStatut(): string {
    return { en_cours: 'En cours', planifie: 'Planifié', termine: 'Terminé', brouillon: 'Brouillon' }[this.statut];
  }
  
  get totalVotes(): number { return this.resultats?.total_votes ?? 0; }
  
  // Remplacement des champs manquants de l'API par des valeurs gérées localement
  get totalInscrits(): number { return 100; } // À lier à votre logique d'inscription plus tard
  
  get tauxParticipation(): number {
    if (!this.totalInscrits || !this.totalVotes) return 0;
    return Math.round((this.totalVotes / this.totalInscrits) * 100);
  }

  get timeline(): Timeline[] {
    if (!this.scrutin) return [];
    const debut = new Date(this.scrutin.date_debut);
    const fin   = new Date(this.scrutin.date_fin);
    const now   = new Date();

    return [
      {
        date:  this.fmt(this.scrutin.date_debut),
        label: 'Ouverture du scrutin',
        fait:  now > debut,
        actif: false,
      },
      {
        date:  'En cours',
        label: 'Phase active — Votes en cours',
        fait:  false,
        actif: this.statut === 'en_cours',
      },
      {
        date:  this.fmt(this.scrutin.date_fin),
        label: 'Clôture du scrutin',
        fait:  now > fin,
        actif: false,
      },
      {
        date:  'Après clôture',
        label: 'Publication des résultats',
        fait:  this.statut === 'termine',
        actif: false,
      },
    ];
  }

  // ── Données fictives complémentaires ─────────────────────
  documents = [
    { icone: 'bi-file-earmark-pdf',  nom: 'Règlement du scrutin.pdf',       taille: '245 Ko' },
    { icone: 'bi-file-earmark-text', nom: 'Critères d\'éligibilité.docx',   taille: '128 Ko' },
  ];

  scrutinsRecents: any[] = []; // Pourrait être chargé depuis l'API publics

  // ── Init ─────────────────────────────────────────────────

  ngOnInit(): void {
    if (this.scrutinId) {
      this.chargerScrutin(this.scrutinId);
    }
  }

  chargerScrutin(id: number): void {
    this.chargement = true;
    this.svc.getDetailScrutin(id).subscribe({
      next: (scrutin) => {
        this.scrutin = scrutin;
        this.chargerCandidats(id);
        if (this.statut === 'termine') {
          this.chargerResultats(id);
        }
      },
      error: () => {
        this.erreur = 'Impossible de charger le scrutin.';
        this.chargement = false;
      }
    });
  }

  chargerCandidats(scrutinId: number): void {
    this.svc.getCandidatsScrutin(scrutinId).subscribe({
      next: (candidats) => {
        this.candidats = candidats;
        this.chargement = false;
      },
      error: () => {
        this.candidats = [];
        this.chargement = false;
      }
    });
  }

  chargerResultats(scrutinId: number): void {
    this.svc.getResultats(scrutinId).subscribe({
      next: (r) => { this.resultats = r; },
      error: () => { this.resultats = null; }
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  getPourcentageCandidat(candidatId: number): number {
    if (!this.resultats) return 0;
    const r = this.resultats.resultats.find(x => x.candidat_id === candidatId);
    return r ? r.pourcentage : 0;
  }

  getVotesCandidat(candidatId: number): number {
    if (!this.resultats) return 0;
    const r = this.resultats.resultats.find(x => x.candidat_id === candidatId);
    return r ? r.votes : 0;
  }

  private couleurs = ['#4f46e5', '#0891b2', '#be185d', '#7c3aed', '#065f46', '#b45309'];
  getCouleurCandidat(idx: number): string {
    return this.couleurs[idx % this.couleurs.length];
  }

  getInitiales(nom: string): string {
    return nom.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

   fmt(iso: string): string {
    return VotifyService.formatDate(iso);
  }

  getLargeurBarre(pct: number): string { return `${pct}%`; }

  setOnglet(route: string): void {
    this.ongletActif = route;
    this.navItems.forEach(i => i.actif = i.route === route);
  }
}
