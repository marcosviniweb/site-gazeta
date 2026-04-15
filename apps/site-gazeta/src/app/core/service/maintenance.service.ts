import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@site-gazeta/env';

export interface MaintenanceConfig {
  id: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMaintenanceStatus(): Observable<boolean> {
    return this.http.get<MaintenanceConfig | null>(`${this.apiUrl}/config/maintenance`)
      .pipe(
        map(config => config?.isActive ?? false),
        catchError(() => of(false)) // Em caso de erro, assume que não está em manutenção
      );
  }
}

