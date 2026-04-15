import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@site-gazeta/env';
import { Observable } from 'rxjs';

// ========== INTERFACES ==========

export interface KPIMetrics {
  totalViews: number;
  totalNews: number;
  activeUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface TopNews {
  id: number;
  title: string;
  views: number;
  author: string;
  publishedAt: string;
  categoryName?: string;
}

export interface UserActivity {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType?: string;
  entityId?: number;
  description?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface CategoryStats {
  id: number;
  name: string;
  views: number;
  count: number;
}

export interface AuthorStats {
  id: number;
  name: string;
  views: number;
  count: number;
}

export interface DeviceStats {
  device: string;
  count: number;
  percentage: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  authorId?: number;
  period?: 'day' | 'week' | 'month' | 'year';
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/analytics`;

  /**
   * Obter KPIs principais
   */
  getKPIs(filters?: AnalyticsFilters): Observable<KPIMetrics> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof AnalyticsFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<KPIMetrics>(`${this.apiUrl}/kpis`, { params });
  }

  /**
   * Obter série temporal de visualizações
   */
  getViewsTimeSeries(filters?: AnalyticsFilters): Observable<TimeSeriesData[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof AnalyticsFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<TimeSeriesData[]>(`${this.apiUrl}/views/time-series`, { params });
  }

  /**
   * Obter notícias mais visualizadas
   */
  getTopNews(limit = 10, filters?: AnalyticsFilters): Observable<TopNews[]> {
    let params = new HttpParams().set('limit', limit.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof AnalyticsFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<TopNews[]>(`${this.apiUrl}/top-news`, { params });
  }

  /**
   * Obter atividades recentes dos usuários
   */
  getUserActivities(
    limit = 20, 
    userId?: number
  ): Observable<UserActivity[]> {
    let params = new HttpParams().set('limit', limit.toString());
    
    if (userId) {
      params = params.set('userId', userId.toString());
    }

    return this.http.get<UserActivity[]>(`${this.apiUrl}/activities`, { params });
  }

  /**
   * Registrar visualização de notícia
   */
  trackNewsView(newsId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/track/view`, { 
      newsId,
      path: `/news/${newsId}`
    });
  }

  /**
   * Obter estatísticas por categoria
   */
  getCategoryStats(filters?: AnalyticsFilters): Observable<CategoryStats[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof AnalyticsFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<CategoryStats[]>(`${this.apiUrl}/categories/stats`, { params });
  }

  /**
   * Obter estatísticas por autor
   */
  getAuthorStats(filters?: AnalyticsFilters): Observable<AuthorStats[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof AnalyticsFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<AuthorStats[]>(`${this.apiUrl}/authors/stats`, { params });
  }

  /**
   * Obter estatísticas de dispositivos
   */
  getDeviceStats(filters?: AnalyticsFilters): Observable<DeviceStats[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof AnalyticsFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<DeviceStats[]>(`${this.apiUrl}/devices/stats`, { params });
  }
}

