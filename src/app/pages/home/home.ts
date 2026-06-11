// ============================================================
// COMMANDE CLI : ng generate component pages/home --standalone --skip-tests
//
// RÔLE : Page d'accueil publique de Votify.
//        Contient le hero, les stats, les fonctionnalités,
//        la section sécurité et le CTA final.
//        Aucun appel API — données fictives uniquement.
// ============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interface pour typer les cartes de fonctionnalités
interface Feature {
  icon: string;
  titre: string;
  description: string;
}

// Interface pour typer les statistiques
interface Stat {
  valeur: string;
  label: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {

  // ── Données fictives : statistiques ──────────────────────
  stats: Stat[] = [
    { valeur: '500+',  label: 'ORGANISATIONS'       },
    { valeur: '2M+',   label: 'VOTES SÉCURISÉS'     },
    { valeur: '99.9%', label: 'DISPONIBILITÉ'        },
    { valeur: '0',     label: 'FAILLES DE SÉCURITÉ'  },
  ];

  // ── Données fictives : fonctionnalités ───────────────────
  features: Feature[] = [
    {
      icon: 'bi-clipboard2-check',
      titre: 'Gestion des scrutins',
      description: 'Créez et configurez vos élections en quelques clics. Paramétrez les dates, les types de vote et les électeurs facilement.'
    },
    {
      icon: 'bi-shield-check',
      titre: 'Vote sécurisé',
      description: 'Chaque bulletin est chiffré. Notre protocole garantit l\'anonymat complet tout en empêchant toute fraude électorale.'
    },
    {
      icon: 'bi-bar-chart-line',
      titre: 'Résultats automatiques',
      description: 'Oubliez le dépouillement manuel. Obtenez des résultats certifiés et des rapports détaillés instantanément.'
    },
    {
      icon: 'bi-people',
      titre: 'Gestion des candidats',
      description: 'Présentez les profils, les programmes et les photos des candidats pour aider vos électeurs à faire un choix éclairé.'
    },
  ];

  // ── Points de sécurité ───────────────────────────────────
  pointsSecurite: string[] = [
    'Chiffrement de bout en bout des bulletins',
    'Anonymat mathématiquement prouvé',
    'Auditabilité complète du processus électoral',
    'Hébergement souverain et certifié',
  ];
}
