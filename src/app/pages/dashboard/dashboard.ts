// ============================================================
// COMMANDE CLI : ng generate component pages/dashboard --standalone --skip-tests
//
// RÔLE : Dashboard superadmin avec sidebar, cartes stats,
//        tableau des demandes et tableau des administrateurs.
// ============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
// 🌟 MODIFICATION : Ajout des imports nécessaires pour les formulaires réactifs
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SuperAdminService } from '../../services/superadmin';

// ── Interfaces pour typer les données fictives ────────────

interface StatCard {
  titre: string;
  valeur: string;
  variation?: string;        // Ex: "+12%"
  variationPositive?: boolean;
  sousTitre: string;
  icone: string;
}

// 🌟 MODIFICATION : Alignement de l'interface avec le modèle Django DemandeAdmin
interface DemandeAdmin {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  cni: string;
  organisation: string;
  motif: string;
  statut: 'en_attente' | 'acceptee' | 'refusee';
  date_creation: string;
}

// 🌟 MODIFICATION : Alignement de l'interface Administrateur avec ton modèle User Django
interface Administrateur {
  id: number;
  username: string;
  email: string;
  telephone?: string;
  cni?: string;
  role: string;
  is_active: boolean; // Utilisation du champ natif de Django
}

interface NavItem {
  label: string;
  icone: string;
  route: string;
  actif: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // 🌟 MODIFICATION : Ajout de ReactiveFormsModule dans les imports du composant pour faire fonctionner le formulaire HTML
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  superAdmin: any = {};
  ongletActif = 'dashboard';

  // 🌟 MODIFICATION : Ajout des propriétés pour gérer la visibilité de la modal et le formulaire réactif
  adminForm!: FormGroup;
  afficherModal: boolean = false;

  // ── Données fictives : navigation sidebar ─────────────
  navItems: NavItem[] = [
    { label: 'Tableau de bord', icone: 'bi-grid-1x2-fill', route: 'dashboard', actif: true },
    { label: 'Demandes admins', icone: 'bi-person-plus-fill', route: 'demandes', actif: false },
    { label: 'Administrateurs', icone: 'bi-people-fill', route: 'administrateurs', actif: false },
  ];

  // ── Données fictives : cartes statistiques ────────────
 stats: StatCard[] = [];
  // 🌟 MODIFICATION : Injection de FormBuilder dans le constructeur et initialisation des règles de validation du formulaire
  constructor(
    private superAdminService: SuperAdminService,
    private fb: FormBuilder
  ) { 
    this.adminForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      cni: ['']
    });
  }

  demandes: DemandeAdmin[] = [];
  administrateurs: Administrateur[] = [];

  // validation d'une demande
  validerDemande(id: number): void {
    this.superAdminService
      .validerDemande(id)
      .subscribe({
        next: () => {
          this.demandes = this.demandes.filter(d => d.id !== id);
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  // refus d'une demande
  refuserDemande(id: number): void {
    this.superAdminService
      .refuserDemande(id)
      .subscribe({
        next: () => {
          this.demandes = this.demandes.filter(d => d.id !== id);
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  // Changer l'onglet actif dans la sidebar
  setOnglet(route: string): void {
    this.ongletActif = route;
    this.navItems.forEach(item => item.actif = item.route === route);
  }

  ngOnInit(): void {
    // 1. Récupération des demandes sécurisée
    this.superAdminService.getDemandes()
      .subscribe({
        next: (data: any) => {
          console.log("Données reçues pour DEMANDES :", data);
          if (Array.isArray(data)) {
            this.demandes = data;
          } else if (data && Array.isArray(data.results)) {
            this.demandes = data.results;
          } else {
            this.demandes = [];
            console.warn("getDemandes n'a pas renvoyé un tableau. Format corrigé en [].");
          }
        },
        error: (err) => {
          console.error("Erreur getDemandes :", err);
          this.demandes = [];
        }
      });

    // 2. Récupération du profil
    this.superAdminService.getProfile()
      .subscribe({
        next: (data: any) => {
          this.superAdmin = data;
        },
        error: (err) => {
          console.error("Erreur getProfile :", err);
        }
      });

    // 3. Récupération des administrateurs sécurisée
    this.rafraichirAdmins();
  }

  // 🌟 MODIFICATION : factorisation de la récupération des admins pour pouvoir la réutiliser après une création directe
  rafraichirAdmins(): void {
    this.superAdminService.getAdmins()
      .subscribe({
        next: (data: any) => {
          console.log("Données reçues pour ADMINS :", data);
          if (Array.isArray(data)) {
            this.administrateurs = data;
            this.mettreAJourStats();
          } else if (data && Array.isArray(data.results)) {
            this.administrateurs = data.results;
          } else {
            this.administrateurs = [];
            console.warn("getAdmins n'a pas renvoyé un tableau. Format corrigé en [].");
          }
        },
        error: (err) => {
          console.error("Erreur getAdmins :", err);
          this.administrateurs = [];
        }
      });
  }

  // Déconnexion
  onLogout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    window.location.href = '/login';
  }

  chargerDemandes() {
    this.superAdminService.getDemandes()
      .subscribe({
        next: (data: any) => {
          if (Array.isArray(data)) {
            this.demandes = data;
            this.mettreAJourStats();
          } else if (data && Array.isArray(data.results)) {
            this.demandes = data.results;
          } else {
            this.demandes = [];
          }
        },
        error: (err) => {
          console.log(err);
          this.demandes = [];
        }
      });
  }
  // Active ou désactive un administrateur à l'écran
// MODIFICATION : Gestion de l'activation/désactivation
  toggleStatutAdmin(admin: any): void {
  // On appelle le service (qui pointe vers notre vue Django modifiée)
  this.superAdminService.modifierStatutAdmin(admin.id, !admin.is_active).subscribe({
    next: (response) => {
      // On applique la réponse réelle renvoyée par le serveur Django
      admin.is_active = response.is_active;
      console.log(`L'admin est maintenant : ${admin.is_active ? 'Actif' : 'Suspendu'}`);
    },
    error: (err) => {
      console.error("Erreur lors du changement de statut", err);
      alert("Impossible de modifier le statut.");
    }
  });
}
  // MODIFICATION : Ajout des méthodes d'ouverture / fermeture de la modal
  ouvrirModal(): void {
    this.adminForm.reset();
    this.afficherModal = true;
  }

  fermerModal(): void {
    this.afficherModal = false;
  }

  // MODIFICATION : Ajout de la méthode de soumission pour créer l'administrateur en appelant le service
  soumettreAdmin(): void {
    if (this.adminForm.valid) {
      this.superAdminService.creerAdminDirect(this.adminForm.value).subscribe({
        next: (response:any) => {
          alert(response.message || "Administrateur créé avec succès !");
          this.fermerModal();
          this.rafraichirAdmins(); // Actualise le tableau instantanément à l'écran
        },
        error: (err:any) => {
          console.error(err);
          alert(err.error?.error || "Une erreur est survenue lors de la création.");
        }
      });
    }
  }

  mettreAJourStats(): void {

  this.stats = [

    {
      titre: 'Total Scrutins',
      valeur: '0',
      sousTitre: 'Scrutins créés',
      icone: 'bi-clipboard2-check'
    },

    {
      titre: 'Total Admins',
      valeur: this.administrateurs.length.toString(),
      sousTitre: 'Administrateurs enregistrés',
      icone: 'bi-people'
    },

    {
      titre: 'Total Electeurs',
      valeur: '0',
      sousTitre: 'Electeurs inscrits',
      icone: 'bi-person-vcard'
    },

    {
      titre: 'Demandes en attente',
      valeur: this.demandes.length.toString(),
      sousTitre: 'Demandes à traiter',
      icone: 'bi-person-plus'
    }

  ];

}
}