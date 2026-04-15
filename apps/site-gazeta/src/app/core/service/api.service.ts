import { inject, Injectable } from '@angular/core';
import {
  Category,
  News,
  Video,
  Menu,
  Ads,
  SectionOrderConfig,
  SectionOrderConfigMap,
  PaginatedResponse,
  PaginationParams,
} from '@site-gazeta/models';
import { map, Observable, tap } from 'rxjs';
import { environment } from '@site-gazeta/env';
import { HttpClient } from '@angular/common/http';
import { toHttpParams } from '@site-gazeta/api';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getMenu() {
    return this.http.get<Menu[]>(`${this.apiUrl}/menu`);
  }

  getMenuById(id: number) {
    return this.http.get(`${this.apiUrl}/menu/${id}`);
  }
  getHomeConfig() {
    return this.http.get<SectionOrderConfig[]>(
      `${this.apiUrl}/config/sections`,
    );
  }

  getHomeConfigMap() {
    return this.http
      .get<SectionOrderConfigMap>(`${this.apiUrl}/config/sections-map`)
      .pipe(
        map((config) => {
          // Se não houver configurações, retornar valores padrão
          if (!config || Object.keys(config).length === 0) {
            const now = new Date().toISOString();
            return {
              carousel: {
                id: 0,
                sectionId: 'carousel',
                name: 'Carrossel',
                title: 'Últimas Notícias',
                order: 1,
                showTitle: true,
                icon: 'view_carousel',
                createdAt: now,
                updatedAt: now,
                createdBy: 0,
              },
              destaques: {
                id: 0,
                sectionId: 'destaques',
                name: 'Destaques',
                title: 'Destaques',
                order: 2,
                showTitle: true,
                icon: 'star',
                createdAt: now,
                updatedAt: now,
                createdBy: 0,
              },
              videos: {
                id: 0,
                sectionId: 'videos',
                name: 'Vídeos',
                title: 'Vídeos em Alta',
                order: 3,
                showTitle: true,
                icon: 'play_circle',
                createdAt: now,
                updatedAt: now,
                createdBy: 0,
              },
              'top-gazeta': {
                id: 0,
                sectionId: 'top-gazeta',
                name: 'Top Gazeta',
                title: 'Top Gazeta',
                order: 4,
                showTitle: true,
                icon: 'trending_up',
                createdAt: now,
                updatedAt: now,
                createdBy: 0,
              },
              cluster: {
                id: 0,
                sectionId: 'cluster',
                name: 'Cluster',
                title: 'Mais Notícias',
                order: 5,
                showTitle: true,
                icon: 'apps',
                createdAt: now,
                updatedAt: now,
                createdBy: 0,
              },
            } as SectionOrderConfigMap;
          }
          return config;
        }),
      );
  }

  getVideosById(id: number) {
    return this.http.get<Video>(`${this.apiUrl}/videos/${id}`);
  }

  getNews(params?: PaginationParams): Observable<PaginatedResponse<News>> {
    const httpParams = toHttpParams(params);
    return this.http
      .get<
        PaginatedResponse<News>
      >(`${this.apiUrl}/news`, { params: httpParams })
      .pipe();
  }

  getNewsById(id: number) {
    return this.http.get(`${this.apiUrl}/news/${id}`);
  }

  getCategories() {
    return this.http.get<Category[]>(`${this.apiUrl}/categories/all`);
  }

  getActiveCategories() {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategory(id: number) {
    return this.http.get(`${this.apiUrl}/categories/${id}`);
  }

  getAds() {
    return this.http.get<Ads[]>(`${this.apiUrl}/advertisements`);
  }

  getAdsById(id: number) {
    return this.http.get(`${this.apiUrl}/advertisements/${id}`);
  }

  getAdsByPlacementAndPosition(placement: string, position: string) {
    return this.http.get<Record<string, Ads>>(
      `${this.apiUrl}/advertisements/active/${placement}/${position}`,
    );
  }
  getAdsByPlacement(placement: string) {
    return this.http.get<Ads[]>(
      `${this.apiUrl}/advertisements/by-page/${placement}`,
    );
  }

  getNewsBySlug(slug: string): Observable<News | undefined> {
    return this.http
      .get<News | PaginatedResponse<News>>(`${this.apiUrl}/news/slug/${slug}`)
      .pipe(
        map((response) => ('data' in response ? response.data[0] : response)),
      );
  }

  getCategoryBySlug(slug: string): Observable<Category | undefined> {
    return this.http.get<Category>(`${this.apiUrl}/categories/slug/${slug}`);
  }

  getNewsByCategory(
    categoryId: number,
    params?: PaginationParams,
  ): Observable<PaginatedResponse<News>> {
    const httpParams = toHttpParams(params);
    return this.http.get<PaginatedResponse<News>>(
      `${this.apiUrl}/news/category/${categoryId}`,
      { params: httpParams },
    );
  }

  getRelatedNews(categoryId: number[], newsId: number): Observable<News[]> {
    // Usa o endpoint correto /news/related-news/:id
    // Este endpoint não suporta exclude (notícias relacionadas devem mostrar todas)
    return this.http
      .get<
        News[] | PaginatedResponse<News>
      >(`${this.apiUrl}/news/related-news/${newsId}`)
      .pipe(
        map((response) => (Array.isArray(response) ? response : response.data)),
      );
  }

  getNewsForCategory(
    categoryId: number,
    params?: PaginationParams,
  ): Observable<News[]> {
    const httpParams = toHttpParams(params);
    return this.http
      .get<
        News[] | PaginatedResponse<News>
      >(`${this.apiUrl}/news/category/${categoryId}`, { params: httpParams })
      .pipe(
        map((response) => (Array.isArray(response) ? response : response.data)),
      );
  }

  getBySearch(search: string, limit = 12): Observable<PaginatedResponse<News>> {
    const params = toHttpParams({ search, limit });
    return this.http.get<PaginatedResponse<News>>(
      `${this.apiUrl}/news/search`,
      { params },
    );
  }
}
