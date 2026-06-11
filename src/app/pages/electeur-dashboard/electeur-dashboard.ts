// src/app/pages/electeur-dashboard/electeur-dashboard.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  VotifyService, ScrutinAPI, CandidatAPI, ResultatScrutin,
  InscriptionAPI, UserProfile, NotificationAPI,
} from '../../services/votify.service';
import { forkJoin, interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

type VueActive = 'accueil' | 'rechercher' | 'mes-scrutins' | 'detail' | 'resultats' | 'profil';
type StatutScrutin = 'en_cours' | 'planifie' | 'termine' | 'brouillon';

interface ScrutinUI extends ScrutinAPI {
  statut: StatutScrutin;
  estInscrit: boolean;
  aVote: boolean;
  inscriptionId?: number;
  inscriptionStatut?: string;
  participation: number;
}

@Component({
  selector: 'app-electeur-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './electeur-dashboard.html',
  styleUrls: ['./electeur-dashboard.scss']
})
export class ElecteurDashboardComponent implements OnInit, OnDestroy {

  private svc = inject(VotifyService);
  private fb  = inject(FormBuilder);
  private notifSub?: Subscription;

  vueActive      = signal<VueActive>('accueil');
  sidebarOuverte = signal(false);
  scrutinActif   = signal<ScrutinUI | null>(null);
  afficherNotifs = signal(false);

  // États de chargement séparés pour éviter le spinner global
  chargementScrutins   = false;   // chargement liste principale
  chargementCandidats  = false;   // chargement candidats d'un scrutin
  chargementResultats  = false;   // chargement résultats
  erreur  = signal<string | null>(null);
  msgSucces = signal<string | null>(null);

  // Profil
  profil: UserProfile | null = null;
  get nomAffiche()  { return this.profil ? VotifyService.getNomAffiche(this.profil) : ''; }
  get prenomCourt() { return this.profil ? (this.profil.first_name || this.profil.username) : ''; }
  get initialesUser() { return this.profil ? VotifyService.getInitialesUser(this.profil) : '...'; }

  // Notifications
  notifications: NotificationAPI[] = [];
  nbNotifsNonLues = 0;

  // Formulaire inscription
  inscriptionForm: FormGroup;
  scrutinInscription: ScrutinUI | null = null;
  afficherModalInscription = signal(false);
  inscriptionEnCours = false;

  // Formulaire profil
  profilForm: FormGroup;
  mdpForm: FormGroup;
  modifProfilEnCours = false;
  modifMdpEnCours    = false;

  navItems = [
    { label: 'Accueil',               icone: 'bi-house-fill',       vue: 'accueil'      },
    { label: 'Rechercher un scrutin', icone: 'bi-search',           vue: 'rechercher'   },
    { label: 'Mes scrutins',          icone: 'bi-clipboard2-check', vue: 'mes-scrutins' },
    { label: 'Résultats',             icone: 'bi-bar-chart-fill',   vue: 'resultats'    },
    { label: 'Profil',                icone: 'bi-person-circle',    vue: 'profil'       },
  ];

  scrutinsPublics:  ScrutinUI[]      = [];
  mesInscriptions:  InscriptionAPI[] = [];
  candidats:        CandidatAPI[]    = [];
  resultats:        ResultatScrutin | null = null;

  recherche   = '';
  filtreActif = 'Tout';
  filtres     = ['Tout', 'En cours', 'Terminé', 'Planifié'];
  candidatChoisi: number | null = null;

  get scrutinsFiltres(): ScrutinUI[] {
    return this.scrutinsPublics.filter(s => {
      const mf = this.filtreActif === 'Tout' ||
        (this.filtreActif === 'En cours' && s.statut === 'en_cours') ||
        (this.filtreActif === 'Terminé'  && s.statut === 'termine') ||
        (this.filtreActif === 'Planifié' && s.statut === 'planifie');
      const mr = !this.recherche.trim() || s.titre.toLowerCase().includes(this.recherche.toLowerCase());
      return mf && mr;
    });
  }
  get scrutinsEnCours():    ScrutinUI[] { return this.scrutinsPublics.filter(s => s.statut === 'en_cours').slice(0, 6); }
  get mesScrutinsInscrits(): ScrutinUI[] { return this.scrutinsPublics.filter(s => s.estInscrit); }
  get historiqueScrutins():  ScrutinUI[] { return this.scrutinsPublics.filter(s => s.aVote || s.statut === 'termine'); }
  get gagnant() {
    if (!this.resultats?.resultats.length) return null;
    return this.resultats.resultats.reduce((a, b) => a.votes > b.votes ? a : b);
  }
  get totalVotes(): number { return this.resultats?.total_votes ?? 0; }

  constructor() {
    this.inscriptionForm = this.fb.group({
      nom_electeur: ['', Validators.required],
      organisation: ['', Validators.required],
    });
    this.profilForm = this.fb.group({
      username:  ['', Validators.required],
      telephone: [''],
    });
    this.mdpForm = this.fb.group({
      old_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

ngOnInit(): void {
  // Charger profil en parallèle des scrutins — SANS spinner bloquant
  this.chargementScrutins = true;

  forkJoin({
    profil:       this.svc.getProfile(),
    scrutins:     this.svc.getScrutinsPublics(),
    inscriptions: this.svc.getMesInscriptions(),
  }).subscribe({
    next: ({ profil, scrutins, inscriptions }) => {
      this.profil = profil;
      this.profilForm.patchValue({ username: profil.username, telephone: profil.telephone ?? '' });

      // 1. SÉCURISATION DES INSCRIPTIONS 🛠️
      const donneesInscriptions = inscriptions as any;
      const listeInscriptions = Array.isArray(donneesInscriptions)
        ? donneesInscriptions
        : (donneesInscriptions?.results || donneesInscriptions?.data || []);
      
      // Stockage de la liste nettoyée
      this.mesInscriptions = listeInscriptions;

      // 2. SÉCURISATION DES SCRUTINS 🛠️
      const donneesScrutins = scrutins as any;
      const listeScrutins = Array.isArray(donneesScrutins) 
        ? donneesScrutins 
        : (donneesScrutins?.results || donneesScrutins?.data || []);

      // 3. ENRICHISSEMENT SANS CRASH
      // On passe la liste propre 'listeInscriptions' à la place de l'objet brut
      this.scrutinsPublics = listeScrutins.map((s: any) => this.enrichirScrutin(s, listeInscriptions));
      
      this.chargementScrutins = false;
    },
    error: (err) => {
      console.error('Erreur au chargement du dashboard électeur :', err);
      this.erreur.set('Impossible de charger les données.');
      this.chargementScrutins = false;
    }
  });

  // Polling notifications toutes les 30s
  this.notifSub = interval(30000).pipe(
    startWith(0),
    switchMap(() => this.svc.getNombreNonLues())
  ).subscribe({ next: (r) => { this.nbNotifsNonLues = r.non_lues; } });
}
  ngOnDestroy(): void { this.notifSub?.unsubscribe(); }

  private enrichirScrutin(s: ScrutinAPI, inscriptions: InscriptionAPI[]): ScrutinUI {
    const insc = inscriptions.find(i => i.scrutin === s.id);
    return {
      ...s,
      statut:            VotifyService.getStatut(s),
      estInscrit:        !!insc,
      inscriptionId:     insc?.id,
      inscriptionStatut: insc?.statut,
      aVote:             false,
      participation:     0,
    };
  }

  // ── Notifications ─────────────────────────────────────

  toggleNotifs(): void {
    this.afficherNotifs.update(v => !v);
    if (this.afficherNotifs()) {
      this.svc.getMesNotifications().subscribe({ next: n => { this.notifications = n; } });
      if (this.nbNotifsNonLues > 0)
        this.svc.marquerNotificationsLues().subscribe({ next: () => { this.nbNotifsNonLues = 0; } });
    }
  }

  getIconeNotif(type: string): string {
    return { inscription_demande:'bi-person-plus-fill text-primary', inscription_acceptee:'bi-check-circle-fill text-success', inscription_refusee:'bi-x-circle-fill text-danger' }[type] ?? 'bi-bell';
  }

  // ── Navigation ────────────────────────────────────────

  aller(vue: any): void {
    this.vueActive.set(vue);
    this.sidebarOuverte.set(false);
    this.afficherNotifs.set(false);
    this.erreur.set(null);
    this.msgSucces.set(null);
    this.candidatChoisi = null;
    window.scrollTo(0, 0);
  }

  ouvrirDetail(scrutin: ScrutinUI): void {
    this.scrutinActif.set(scrutin);
    this.candidats = [];
    this.resultats = null;
    this.candidatChoisi = null;
    this.chargementCandidats = true;

    this.svc.getCandidatsScrutin(scrutin.id).subscribe({
      next: (c) => { this.candidats = c; this.chargementCandidats = false; },
      error: ()  => { this.chargementCandidats = false; }
    });

    if (scrutin.statut === 'termine') {
      this.chargementResultats = true;
      this.svc.getResultats(scrutin.id).subscribe({
        next: (r) => { this.resultats = r; this.chargementResultats = false; },
        error: ()  => { this.chargementResultats = false; }
      });
    }

    this.vueActive.set('detail');
    this.sidebarOuverte.set(false);
    window.scrollTo(0, 0);
  }

  ouvrirResultats(scrutin: ScrutinUI): void {
    this.scrutinActif.set(scrutin);
    this.resultats = null;
    this.candidats = [];
    this.chargementResultats = true;

    forkJoin({
      candidats: this.svc.getCandidatsScrutin(scrutin.id),
      resultats: this.svc.getResultats(scrutin.id),
    }).subscribe({
      next: ({ candidats, resultats }) => {
        this.candidats = candidats;
        this.resultats = resultats;
        this.chargementResultats = false;
      },
      error: () => { this.chargementResultats = false; this.erreur.set('Impossible de charger les résultats.'); }
    });

    this.vueActive.set('resultats');
    this.sidebarOuverte.set(false);
    window.scrollTo(0, 0);
  }

  // ── Inscription ───────────────────────────────────────

  ouvrirModalInscription(scrutin: ScrutinUI): void {
    this.scrutinInscription = scrutin;
    this.inscriptionForm.reset();
    if (this.profil) this.inscriptionForm.patchValue({ nom_electeur: this.nomAffiche });
    this.afficherModalInscription.set(true);
  }

  fermerModalInscription(): void {
    this.afficherModalInscription.set(false);
    this.scrutinInscription = null;
  }

  confirmerInscription(): void {
    if (this.inscriptionForm.invalid || !this.scrutinInscription) {
      this.inscriptionForm.markAllAsTouched(); return;
    }
    this.inscriptionEnCours = true;
    const { nom_electeur, organisation } = this.inscriptionForm.value;

    this.svc.sInscrireScrutin(this.scrutinInscription.id, nom_electeur, organisation).subscribe({
      next: (insc) => {
        const s = this.scrutinsPublics.find(x => x.id === this.scrutinInscription!.id);
        if (s) { s.estInscrit = true; s.inscriptionId = insc.id; s.inscriptionStatut = 'en_attente'; }
        if (this.scrutinActif()?.id === this.scrutinInscription?.id) {
          const a = this.scrutinActif()!;
          a.estInscrit = true; a.inscriptionId = insc.id; a.inscriptionStatut = 'en_attente';
        }
        this.mesInscriptions.push(insc);
        this.fermerModalInscription();
        this.msgSucces.set('Inscription envoyée ! En attente de validation par l\'administrateur.');
        this.inscriptionEnCours = false;
      },
      error: (err) => {
        this.erreur.set(err?.error?.detail ?? err?.error?.non_field_errors?.[0] ?? 'Erreur lors de l\'inscription.');
        this.inscriptionEnCours = false;
      }
    });
  }

  // ── Vote ──────────────────────────────────────────────

  choisirCandidat(id: number): void { this.candidatChoisi = id; }

  confirmerVote(): void {
    if (!this.candidatChoisi) { this.erreur.set('Veuillez choisir un candidat.'); return; }
    this.svc.voter(this.candidatChoisi).subscribe({
      next: () => {
        const s = this.scrutinActif();
        if (s) {
          s.aVote = true;
          const idx = this.scrutinsPublics.findIndex(x => x.id === s.id);
          if (idx > -1) this.scrutinsPublics[idx].aVote = true;
        }
        this.candidatChoisi = null;
        this.msgSucces.set('Vote enregistré avec succès !');
        if (s) this.ouvrirResultats(s);
      },
      error: (err) => { this.erreur.set(err?.error?.error ?? 'Erreur lors du vote.'); }
    });
  }

  // ── Profil ────────────────────────────────────────────

  onSubmitProfil(): void {
    if (this.profilForm.invalid) return;
    this.modifProfilEnCours = true;
    this.svc.modifierProfil(this.profilForm.value).subscribe({
      next: (r) => {
        if (this.profil) { this.profil.username = r.username; this.profil.telephone = r.telephone; }
        this.msgSucces.set('Profil mis à jour !');
        this.modifProfilEnCours = false;
      },
      error: () => { this.erreur.set('Erreur mise à jour profil.'); this.modifProfilEnCours = false; }
    });
  }

  onSubmitMdp(): void {
    if (this.mdpForm.invalid) return;
    this.modifMdpEnCours = true;
    this.svc.changerMotDePasse(this.mdpForm.value).subscribe({
      next: () => { this.msgSucces.set('Mot de passe modifié !'); this.mdpForm.reset(); this.modifMdpEnCours = false; },
      error: (e) => { this.erreur.set(e?.error?.error ?? 'Ancien mot de passe incorrect.'); this.modifMdpEnCours = false; }
    });
  }

  deconnecter(): void { this.svc.deconnecter(); }

  // ── Helpers ───────────────────────────────────────────

  getLibelleStatut(s: string): string {
    return { en_cours:'En cours', planifie:'À venir', termine:'Terminé', brouillon:'Brouillon' }[s] ?? s;
  }
  getBoutonLabel(s: ScrutinUI): string {
    if (s.aVote) return 'Voir résultats';
    if (!s.estInscrit) return 'S\'inscrire';
    if (s.inscriptionStatut === 'en_attente') return 'En attente';
    if (s.statut === 'en_cours' && s.inscriptionStatut === 'accepte') return 'Voter';
    return 'Détails';
  }
  getBoutonClass(s: ScrutinUI): string {
    if (s.aVote) return 'btn-resultats';
    if (!s.estInscrit) return 'btn-details';
    if (s.inscriptionStatut === 'en_attente') return 'btn-attente';
    return 'btn-voter';
  }
  onBoutonScrutin(e: Event, s: ScrutinUI): void {
    e.stopPropagation();
    if (s.aVote || s.statut === 'termine') { this.ouvrirResultats(s); return; }
    if (!s.estInscrit) { this.ouvrirModalInscription(s); return; }
    this.ouvrirDetail(s);
  }
  getPourcentageCandidat(id: number): number { return this.resultats?.resultats.find(x => x.candidat_id === id)?.pourcentage ?? 0; }
  getVotesCandidat(id: number): number { return this.resultats?.resultats.find(x => x.candidat_id === id)?.votes ?? 0; }
  getInitiales(nom: string): string { return nom.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase(); }
  private couleurs = ['#4f46e5','#0891b2','#be185d','#7c3aed','#065f46','#b45309'];
  getCouleurCandidat(idx: number): string { return this.couleurs[idx % this.couleurs.length]; }
  private fonds = ['#eef2ff','#e0f2fe','#f0fdf4','#fdf4ff','#fff7ed','#f0f9ff'];
  getCouleurFond(idx: number): string { return this.fonds[idx % this.fonds.length]; }
  fermerMessage(): void { this.erreur.set(null); this.msgSucces.set(null); }
}
