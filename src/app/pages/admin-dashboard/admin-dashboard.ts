// ============================================================
// src/app/pages/admin-dashboard/admin-dashboard.component.ts
// ============================================================

import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  VotifyService, ScrutinAPI, CandidatAPI, CandidatForm,
  InscriptionAPI, StatsDashboard, ResultatScrutin, UserProfile, NotificationAPI,
} from '../../services/votify.service';
import { forkJoin, from, interval, Subscription } from 'rxjs';
import { concatMap, startWith, switchMap } from 'rxjs/operators';

type VueActive = 'dashboard' | 'creer-scrutin' | 'detail-scrutin' | 'modifier-scrutin' | 'inscriptions' | 'resultats' | 'profil';
type StatutScrutin = 'en_cours' | 'planifie' | 'termine' | 'brouillon';

interface ScrutinUI extends ScrutinAPI {
  statut: StatutScrutin;
  participation: number;
  votesExprimes: number;
  totalElecteurs: number;
  dateFin: string;
}

interface StatCard { titre: string; valeur: string; sousTitre: string; icone: string; }

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  private svc = inject(VotifyService);
  private fb  = inject(FormBuilder);
  private notifSub?: Subscription;

  vueActive          = signal<VueActive>('dashboard');
  scrutinSelectionne = signal<ScrutinUI | null>(null);
  sidebarOuverte     = signal(false);
  chargement         = signal(false);
  erreur             = signal<string | null>(null);
  msgSucces          = signal<string | null>(null);
  afficherNotifs     = signal(false);

  // Profil
  profil: UserProfile | null = null;
  get nomAffiche()  { return this.profil ? VotifyService.getNomAffiche(this.profil) : ''; }
  get initialesUser() { return this.profil ? VotifyService.getInitialesUser(this.profil) : '...'; }

  // Notifications
  notifications:  NotificationAPI[] = [];
  nbNotifsNonLues = 0;

  navItems = [
    { label: 'Tableau de bord', icone: 'bi-grid-1x2-fill',   vue: 'dashboard'    },
    { label: 'Inscriptions',    icone: 'bi-person-plus-fill', vue: 'inscriptions' },
    { label: 'Résultats',       icone: 'bi-bar-chart-fill',   vue: 'resultats'    },
    { label: 'Profil',          icone: 'bi-person-circle',    vue: 'profil'       },
  ];

  stats: StatCard[] = [
    { titre: 'Scrutins actifs', valeur: '--', sousTitre: '',                  icone: 'bi-clipboard2-check' },
    { titre: 'Candidats',       valeur: '--', sousTitre: 'Total enregistrés', icone: 'bi-people'           },
    { titre: 'Inscrits',        valeur: '--', sousTitre: 'Électeurs validés', icone: 'bi-person-check'     },
    { titre: 'Votes exprimés',  valeur: '--', sousTitre: 'Total à ce jour',   icone: 'bi-check2-circle'    },
  ];

  scrutins:     ScrutinUI[]      = [];
  candidats:    CandidatAPI[]    = [];
  inscriptions: InscriptionAPI[] = [];
  resultats:    ResultatScrutin | null = null;

  filtreInscription = 'tous';
  get inscriptionsFiltrees(): InscriptionAPI[] {
    if (this.filtreInscription === 'tous') return this.inscriptions;
    const map: Record<string,string> = { en_attente:'en_attente', validee:'accepte', refusee:'refuse' };
    return this.inscriptions.filter(i => i.statut === (map[this.filtreInscription] ?? this.filtreInscription));
  }

  scrutinForm:  FormGroup;
  modifierForm: FormGroup;

  // Formulaire profil
  profilForm: FormGroup;
  mdpForm: FormGroup;
  modifProfilEnCours = false;
  modifMdpEnCours    = false;

  candidatsAAjouter: CandidatForm[] = [];
  nouveauCandidat: CandidatForm = { nom: '', poste: '', description: '', photoFile: null, photoPreview: null };
  afficherFormCandidats = signal(false);
  envoiCandidats        = signal(false);

  nouveauCandidatDetail: CandidatForm = { nom: '', poste: '', description: '', photoFile: null, photoPreview: null };
  afficherFormCandidatsDetail = signal(false);

  constructor() {
    this.scrutinForm = this.fb.group({
      titre:       ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.required],
      dateDebut:   ['', Validators.required],
      dateFin:     ['', Validators.required],
    });
    this.modifierForm = this.fb.group({
      titre:       ['', Validators.required],
      description: [''],
      dateDebut:   [''],
      dateFin:     [''],
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
  this.chargement.set(true);
  forkJoin({
    profil:   this.svc.getProfile(),
    stats:    this.svc.getStatsDashboard(),
    scrutins: this.svc.getMesScrutins(),
  }).subscribe({
    next: ({ profil, stats, scrutins }) => {
      this.profil = profil;
      this.profilForm.patchValue({ username: profil.username, telephone: profil.telephone ?? '' });
      this.appliquerStats(stats);
      
      // 🛠️ FIX ICI : On caste 'scrutins' en 'any' pour éviter l'erreur de type 'never'
      const donneesScrutins = scrutins as any;

      const listeScrutins = Array.isArray(donneesScrutins) 
        ? donneesScrutins 
        : (donneesScrutins?.results || donneesScrutins?.data || []);

      // 🛠️ FIX ICI : On type explicitement le paramètre '(s: any)'
      this.scrutins = listeScrutins.map((s: any) => this.enrichirScrutin(s));
      
      this.chargement.set(false);
    },
    error: (err) => { 
      console.error('Erreur au chargement du dashboard admin :', err);
      this.erreur.set('Impossible de charger le tableau de bord.'); 
      this.chargement.set(false); 
    }
  });

  // Polling notifications toutes les 30s
  this.notifSub = interval(30000).pipe(
    startWith(0),
    switchMap(() => this.svc.getNombreNonLues())
  ).subscribe({ next: (r) => { this.nbNotifsNonLues = r.non_lues; } });
}
  ngOnDestroy(): void { this.notifSub?.unsubscribe(); }

  private appliquerStats(s: StatsDashboard): void {
    this.stats = [
      { titre: 'Scrutins actifs', valeur: String(s.scrutins_actifs), sousTitre: '',                  icone: 'bi-clipboard2-check' },
      { titre: 'Candidats',       valeur: String(s.candidats),       sousTitre: 'Total enregistrés', icone: 'bi-people'           },
      { titre: 'Inscrits',        valeur: String(s.inscrits),        sousTitre: 'Électeurs validés', icone: 'bi-person-check'     },
      { titre: 'Votes exprimés',  valeur: String(s.votes_exprimes),  sousTitre: 'Total à ce jour',   icone: 'bi-check2-circle'    },
    ];
  }

  private enrichirScrutin(s: ScrutinAPI): ScrutinUI {
    return { ...s, statut: VotifyService.getStatut(s), dateFin: `Fin le ${VotifyService.formatDate(s.date_fin)}`, participation: 0, votesExprimes: 0, totalElecteurs: 0 };
  }

  private rafraichirStats(): void {
    this.svc.getStatsDashboard().subscribe({ next: s => this.appliquerStats(s) });
  }

  // ── Notifications ─────────────────────────────────────

  toggleNotifs(): void {
    this.afficherNotifs.update(v => !v);
    if (this.afficherNotifs()) {
      this.svc.getMesNotifications().subscribe({ next: (n) => { this.notifications = n; } });
      if (this.nbNotifsNonLues > 0) {
        this.svc.marquerNotificationsLues().subscribe({ next: () => { this.nbNotifsNonLues = 0; } });
      }
    }
  }

  getIconeNotif(type: string): string {
    return { inscription_demande: 'bi-person-plus-fill text-primary', inscription_acceptee: 'bi-check-circle-fill text-success', inscription_refusee: 'bi-x-circle-fill text-danger' }[type] ?? 'bi-bell';
  }

  // ── Navigation ────────────────────────────────────────

  aller(vue: any): void {
    this.vueActive.set(vue);
    this.erreur.set(null);
    this.msgSucces.set(null);
    this.afficherNotifs.set(false);
    if (vue === 'inscriptions') this.chargerInscriptions();
  }

  voirDetail(scrutin: ScrutinUI): void {
    this.scrutinSelectionne.set(scrutin);
    this.chargement.set(true);
    this.afficherFormCandidatsDetail.set(false);
    this.resultats = null;

    forkJoin({
      candidats: this.svc.getCandidatsScrutin(scrutin.id),
      resultats: scrutin.statut === 'termine'
        ? this.svc.getResultats(scrutin.id)
        : new Promise<null>(resolve => resolve(null)) as any,
    }).subscribe({
      next: ({ candidats, resultats }) => {
        this.candidats = candidats;
        if (resultats) this.resultats = resultats as any;
        this.chargement.set(false);
      },
      error: () => { this.candidats = []; this.chargement.set(false); }
    });
    this.vueActive.set('detail-scrutin');
  }

  ouvrirModifier(scrutin: ScrutinUI): void {
    this.scrutinSelectionne.set(scrutin);
    this.modifierForm.patchValue({
      titre:       scrutin.titre,
      description: scrutin.description,
      dateDebut:   scrutin.date_debut?.substring(0, 16) ?? '',
      dateFin:     scrutin.date_fin?.substring(0, 16) ?? '',
    });
    this.vueActive.set('modifier-scrutin');
  }

  supprimerScrutin(scrutin: ScrutinUI): void {
    if (!confirm(`Supprimer le scrutin "${scrutin.titre}" ?`)) return;
    this.svc.supprimerScrutin(scrutin.id).subscribe({
      next: () => {
        this.scrutins = this.scrutins.filter(s => s.id !== scrutin.id);
        this.msgSucces.set('Scrutin supprimé.');
        this.rafraichirStats();
        this.vueActive.set('dashboard');
      },
      error: () => this.erreur.set('Erreur lors de la suppression.')
    });
  }

  // ── Photo candidat ────────────────────────────────────

  onPhotoSelected(event: Event, cible: 'creation' | 'detail'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (cible === 'creation') this.nouveauCandidat = { ...this.nouveauCandidat, photoFile: file, photoPreview: preview };
      else this.nouveauCandidatDetail = { ...this.nouveauCandidatDetail, photoFile: file, photoPreview: preview };
    };
    reader.readAsDataURL(file);
  }

  ajouterCandidatAAjouterListe(): void {
    if (!this.nouveauCandidat.nom.trim()) return;
    this.candidatsAAjouter.push({ ...this.nouveauCandidat });
    this.nouveauCandidat = { nom: '', poste: '', description: '', photoFile: null, photoPreview: null };
  }

  supprimerCandidatAAjouter(idx: number): void { this.candidatsAAjouter.splice(idx, 1); }

  // ── Créer scrutin ─────────────────────────────────────

  onSubmitScrutin(): void {
    if (this.scrutinForm.invalid) { this.scrutinForm.markAllAsTouched(); return; }
    this.chargement.set(true);
    const v = this.scrutinForm.value;

    this.svc.creerScrutin({ titre: v.titre, description: v.description, date_debut: v.dateDebut, date_fin: v.dateFin, actif: true }).subscribe({
      next: (scrutin) => {
        const scrutinUI = this.enrichirScrutin(scrutin);
        this.scrutins.unshift(scrutinUI);

        if (this.candidatsAAjouter.length === 0) { this.finaliserCreation(); return; }

        this.envoiCandidats.set(true);
        from([...this.candidatsAAjouter]).pipe(concatMap(c => this.svc.ajouterCandidat(scrutin.id, c))).subscribe({
          complete: () => { this.envoiCandidats.set(false); this.finaliserCreation(); },
          error:    () => { this.envoiCandidats.set(false); this.finaliserCreation(); }
        });
      },
      error: () => { this.erreur.set('Erreur lors de la création.'); this.chargement.set(false); }
    });
  }

  private finaliserCreation(): void {
    this.scrutinForm.reset();
    this.candidatsAAjouter = [];
    this.nouveauCandidat = { nom: '', poste: '', description: '', photoFile: null, photoPreview: null };
    this.chargement.set(false);
    this.msgSucces.set('Scrutin créé avec succès !');
    this.rafraichirStats();
    this.vueActive.set('dashboard');
  }

  // ── Modifier scrutin ──────────────────────────────────

  onSubmitModifier(): void {
    if (this.modifierForm.invalid) return;
    const s = this.scrutinSelectionne(); if (!s) return;
    this.chargement.set(true);
    const v = this.modifierForm.value;

    this.svc.modifierScrutin(s.id, { titre: v.titre, description: v.description, ...(v.dateDebut && { date_debut: v.dateDebut }), ...(v.dateFin && { date_fin: v.dateFin }) }).subscribe({
      next: (maj) => {
        const enrichi = this.enrichirScrutin(maj);
        const idx = this.scrutins.findIndex(x => x.id === s.id);
        if (idx > -1) this.scrutins[idx] = enrichi;
        this.scrutinSelectionne.set(enrichi);
        this.chargement.set(false);
        this.msgSucces.set('Scrutin modifié !');
        this.voirDetail(enrichi);
      },
      error: () => { this.erreur.set('Erreur lors de la modification.'); this.chargement.set(false); }
    });
  }

  // ── Inscriptions ──────────────────────────────────────

  chargerInscriptions(): void {
  this.chargement.set(true);
  this.svc.getInscriptionsEnAttente().subscribe({
    next: (d) => {
      // 🛠️ On convertit en 'any' pour éviter les blocages TypeScript
      const donnees = d as any;

      // 🛠️ On extrait le tableau (soit direct, soit depuis .results ou .data)
      this.inscriptions = Array.isArray(donnees)
        ? donnees
        : (donnees?.results || donnees?.data || []);

      this.chargement.set(false);
    },
    error: (err) => {
      console.error('Détail de l’erreur de chargement des inscriptions :', err);
      this.erreur.set('Erreur chargement inscriptions.');
      this.chargement.set(false);
    }
  });
}

  validerInscription(id: number): void {
    this.svc.accepterInscription(id).subscribe({
      next: () => { const i = this.inscriptions.find(x => x.id === id); if (i) i.statut = 'accepte'; this.rafraichirStats(); },
      error: () => this.erreur.set('Erreur lors de la validation.')
    });
  }

  refuserInscription(id: number): void {
    this.svc.refuserInscription(id).subscribe({
      next: () => { const i = this.inscriptions.find(x => x.id === id); if (i) i.statut = 'refuse'; },
      error: () => this.erreur.set('Erreur lors du refus.')
    });
  }

  // ── Candidats dans détail ─────────────────────────────

  ajouterCandidatAuScrutin(): void {
    const s = this.scrutinSelectionne();
    if (!s || !this.nouveauCandidatDetail.nom.trim()) return;
    this.svc.ajouterCandidat(s.id, this.nouveauCandidatDetail).subscribe({
      next: (c) => { this.candidats.push(c); this.nouveauCandidatDetail = { nom: '', poste: '', description: '', photoFile: null, photoPreview: null }; this.afficherFormCandidatsDetail.set(false); this.rafraichirStats(); },
      error: () => this.erreur.set('Erreur ajout candidat.')
    });
  }

  supprimerCandidatAPI(id: number): void {
    if (!confirm('Supprimer ce candidat ?')) return;
    this.svc.supprimerCandidat(id).subscribe({
      next: () => { this.candidats = this.candidats.filter(c => c.id !== id); this.rafraichirStats(); },
      error: () => this.erreur.set('Erreur suppression candidat.')
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
      error: (e) => { this.erreur.set(e?.error?.error ?? 'Erreur changement mot de passe.'); this.modifMdpEnCours = false; }
    });
  }

  deconnecter(): void { this.svc.deconnecter(); }

  // ── Helpers ───────────────────────────────────────────

  getLibelleStatut(s: StatutScrutin): string {
    return { en_cours:'En cours', planifie:'Planifié', termine:'Terminé', brouillon:'Brouillon' }[s];
  }
  getIconeStatut(s: StatutScrutin): string {
    return { en_cours:'bi-clock-fill', planifie:'bi-calendar-event', termine:'bi-check-circle-fill', brouillon:'bi-pencil-square' }[s];
  }
  getCouleurParticipation(p: number): string {
    if (p >= 75) return '#22c55e'; if (p >= 40) return '#2563EB'; if (p > 0) return '#f59e0b'; return '#e5e7eb';
  }
  getPourcentageCandidat(id: number): number { return this.resultats?.resultats.find(x => x.candidat_id === id)?.pourcentage ?? 0; }
  getVotesCandidat(id: number): number { return this.resultats?.resultats.find(x => x.candidat_id === id)?.votes ?? 0; }
  getInitiales(nom: string): string { return nom.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase(); }
  private couleurs = ['#4f46e5','#0891b2','#be185d','#7c3aed','#065f46','#b45309'];
  getCouleurCandidat(idx: number): string { return this.couleurs[idx % this.couleurs.length]; }
  getLibelleStatutInscription(s: string): string { return ({ en_attente:'En attente', accepte:'Validée', refuse:'Refusée' } as any)[s] ?? s; }
  getClasseInscription(s: string): string { return ({ en_attente:'en-attente', accepte:'validee', refuse:'refusee' } as any)[s] ?? ''; }
  get scrutinsTermines(): ScrutinUI[] { return this.scrutins.filter(s => s.statut === 'termine'); }
  fermerMessage(): void { this.erreur.set(null); this.msgSucces.set(null); }
}
