import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://127.0.0.1:8000/api/auth';

  constructor(
    private http: HttpClient
  ) {}

  login(data: any) {
    return this.http.post(
      `${this.apiUrl}/login/`,
      data
    );
  }

  logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }
  register(data: any) {
  return this.http.post(
    `${this.apiUrl}/register/`,
    data
  );
}
}