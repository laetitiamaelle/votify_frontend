import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DemandeAdminService {

  private apiUrl =
    'http://127.0.0.1:8000/api/auth/demande-admin/';

  constructor(
    private http: HttpClient
  ) {}

  creerDemande(data: any) {
    return this.http.post(
      this.apiUrl,
      data
    );
  }
}