import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@site-gazeta/env';
import { tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  authUrl = `${environment.apiUrl}/auth`;

  authLogin(body: { email: string; password: string }, remember: boolean) {
    return this.http
      .post<{ access_token: string }>(`${this.authUrl}/login`, body)
      .pipe(
        tap((response) => {
          this.saveToken(remember, response.access_token);
        }),
      );
  }

  saveToken(remember: boolean, token: string) {
    localStorage.clear();
    sessionStorage.clear();
    if (remember) {
      localStorage.setItem('access_token', token);
    } else {
      sessionStorage.setItem('access_token', token);
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}
