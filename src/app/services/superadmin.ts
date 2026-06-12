// ============================================================
// src/app/services/superadmin.ts — Version complète
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StatsSuperAdmin {
  total_scrutins:   number;
  total_admins:     number;
  total_electeurs:  number;
  demandes_attente: number;
}

@Injectable({ providedIn: 'root' })
export class SuperAdminService {

  private BASE = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── Profil ────────────────────────────────────────────

  getProfile(): Observable<any> {
    return this.http.get(`${this.BASE}/auth/profile/`, { headers: this.headers() });
  }

  // ── Statistiques globales ─────────────────────────────

  getStats(): Observable<StatsSuperAdmin> {
    return this.http.get<StatsSuperAdmin>(
      `${this.BASE}/auth/superadmin/stats/`,
      { headers: this.headers() }
    );
  }

  // ── Demandes admin ────────────────────────────────────

  getDemandes(): Observable<any> {
    return this.http.get(
      `${this.BASE}/auth/liste-demandes-admin/`,
      { headers: this.headers() }
    );
  }

  validerDemande(id: number): Observable<any> {
    return this.http.post(
      `${this.BASE}/auth/valider-demande-admin/${id}/`,
      {},
      { headers: this.headers() }
    );
  }

  refuserDemande(id: number): Observable<any> {
    return this.http.post(
      `${this.BASE}/auth/refuser-demande-admin/${id}/`,
      {},
      { headers: this.headers() }
    );
  }

  // ── Admins ────────────────────────────────────────────

  getAdmins(): Observable<any> {
    return this.http.get(
      `${this.BASE}/auth/superadmin/admins/`,
      { headers: this.headers() }
    );
  }

  creerAdminDirect(data: any): Observable<any> {
    return this.http.post(
      `${this.BASE}/auth/superadmin/creer-admin/`,
      data,
      { headers: this.headers() }
    );
  }

  modifierStatutAdmin(id: number, is_active: boolean): Observable<any> {
    return this.http.patch(
      `${this.BASE}/auth/superadmin/admins/${id}/statut/`,
      { is_active },
      { headers: this.headers() }
    );
  }
}
