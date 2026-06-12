import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DemandeAdminService {


  private apiUrl = environment.apiUrl + '/auth/demande-admin/';

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