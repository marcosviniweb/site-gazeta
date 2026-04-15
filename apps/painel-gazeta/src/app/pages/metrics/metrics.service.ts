import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateRange, Granularity, KpiMetric, LogEvent, TopNewsItem } from './models';
import type { ChartData } from 'chart.js';
import { environment } from '@site-gazeta/env';

interface KpiResponse {
  kpis: KpiMetric[];
}

interface TopNewsResponse {
  topNews: TopNewsItem[];
}

interface ActivityResponse {
  activities: Array<{
    timestamp: string;
    user: string;
    action: string;
    detail?: string;
  }>;
}

interface TimeSeriesResponse {
  labels: string[];
  values: number[];
}

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/analytics`;

  /**
   * Busca KPIs do período
   */
  getKpis(range: DateRange): Observable<KpiMetric[]> {
    const params = new HttpParams()
      .set('startDate', range.start.toISOString())
      .set('endDate', range.end.toISOString());

    return this.http
      .get<KpiResponse>(`${this.apiUrl}/kpis`, { params })
      .pipe(map((response) => response.kpis));
  }

  /**
   * Busca série temporal de acessos
   */
  getAccessSeries(
    range: DateRange,
    granularity: Granularity
  ): Observable<ChartData<'line'>> {
    const params = new HttpParams()
      .set('startDate', range.start.toISOString())
      .set('endDate', range.end.toISOString())
      .set('granularity', granularity);

    return this.http
      .get<TimeSeriesResponse>(`${this.apiUrl}/access-series`, { params })
      .pipe(
        map((response) => ({
          labels: response.labels,
          datasets: [
            {
              label: 'Acessos',
              data: response.values,
              tension: 0.3,
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59,130,246,0.2)',
              fill: true,
            },
          ],
        }))
      );
  }

  /**
   * Busca série temporal de páginas vistas
   */
  getPagesSeries(
    range: DateRange,
    granularity: Granularity
  ): Observable<ChartData<'bar'>> {
    const params = new HttpParams()
      .set('startDate', range.start.toISOString())
      .set('endDate', range.end.toISOString())
      .set('granularity', granularity);

    return this.http
      .get<TimeSeriesResponse>(`${this.apiUrl}/pages-series`, { params })
      .pipe(
        map((response) => ({
          labels: response.labels,
          datasets: [
            {
              label: 'Páginas Vistas',
              data: response.values,
              backgroundColor: '#22C55E',
              borderRadius: 6,
            },
          ],
        }))
      );
  }

  /**
   * Busca top notícias do período
   */
  getTopNews(range: DateRange, size = 10): Observable<TopNewsItem[]> {
    const params = new HttpParams()
      .set('startDate', range.start.toISOString())
      .set('endDate', range.end.toISOString());

    return this.http
      .get<TopNewsResponse>(`${this.apiUrl}/top-news`, { params })
      .pipe(
        map((response) =>
          response.topNews.slice(0, size).map((item) => ({
            ...item,
            lastAccess: new Date(item.lastAccess),
          }))
        )
      );
  }

  /**
   * Busca logs de atividades
   */
  getLogs(range: DateRange, size = 12): Observable<LogEvent[]> {
    const params = new HttpParams()
      .set('startDate', range.start.toISOString())
      .set('endDate', range.end.toISOString());

    return this.http
      .get<ActivityResponse>(`${this.apiUrl}/activities`, { params })
      .pipe(
        map((response) =>
          response.activities.slice(0, size).map((item) => ({
            timestamp: new Date(item.timestamp),
            user: item.user,
            action: item.action,
            detail: item.detail || '',
          }))
        )
      );
  }

  /**
   * Registra visualização de página (público)
   */
  trackView(data: {
    newsId?: number;
    path: string;
    referer?: string;
    sessionId?: string;
    duration?: number;
  }): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/track-view`, data);
  }
}

