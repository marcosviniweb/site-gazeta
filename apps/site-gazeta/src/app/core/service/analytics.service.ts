import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@site-gazeta/env';
import { isPlatformBrowser } from '@angular/common';

interface TrackViewData {
  newsId?: number;
  path: string;
  referer?: string;
  sessionId?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  // Analytics está dentro do prefixo /api do backend
  private analyticsUrl = `${environment.apiUrl}/analytics`;

  /**
   * Registra visualização de página
   * Este endpoint é PÚBLICO - não requer autenticação
   */
  trackView(data: TrackViewData): Observable<any> {
    return this.http.post(`${this.analyticsUrl}/track-view`, data).pipe(
      catchError((error) => {
        console.error('Failed to track view:', error);
        // Não propagar erro - tracking não deve quebrar a aplicação
        return [];
      })
    );
  }

  /**
   * Registra visualização de notícia
   */
  trackNewsView(newsId: number, slug: string, sessionId: string): Observable<any> {
    if (!this.isBrowser) {
      return EMPTY;
    }
    return this.trackView({
      newsId,
      path: `/news/${slug}`,
      referer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      sessionId,
    });
  }

  /**
   * Atualiza visualização com duração
   */
  trackViewDuration(
    newsId: number | undefined,
    path: string,
    sessionId: string,
    duration: number
  ): Observable<any> {
    if (!this.isBrowser) {
      return EMPTY;
    }
    return this.trackView({
      newsId,
      path,
      sessionId,
      duration,
      referer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });
  }

  /**
   * Registra visualização de página genérica
   */
  trackPageView(path: string, sessionId: string): Observable<any> { 
    if (!this.isBrowser) return EMPTY;
    return this.trackView({
      path,
      sessionId,
      referer: document.referrer || undefined,
    });
  }
}

