import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Category, News, PrimaryConfig, SecondaryConfig, Video, SocialMediaConfig, PaginatedResponse, PaginationParams } from '@site-gazeta/models';
import { LIBRARY_CONFIG } from '../config/api-config';
import { toHttpParams } from '../util/api-params.util';

interface CarouselConfig {
  id: number;
  featuredNewsLimit: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface HomeCategoryGridItem {
  category: Category;
  news: News[];
}

export interface HomeHighlightItem {
  category: Category;
  news: News[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  private httpClient = inject(HttpClient);
  private apiUrl = inject(LIBRARY_CONFIG).apiUrl;

  private $newsFeatured = new BehaviorSubject<News[]>([]);
  private $latestNews = new BehaviorSubject<News[]>([]);
  private $videosFeatured = new BehaviorSubject<Video[]>([]);

  getNewsFeatured(): Observable<News[]> {
    if (this.$newsFeatured.value.length > 0) {
      return this.$newsFeatured.asObservable();
    }

    firstValueFrom(this.httpClient.get<News[] | PaginatedResponse<News>>(`${this.apiUrl}/news/featured`)).then((response) => {
      const news = Array.isArray(response) ? response : response.data;
      console.log('API: News Featured loaded', news.length);
      this.$newsFeatured.next(news);
    }).catch((err) => {
      console.error('API Error: getNewsFeatured failed', err);
      this.$newsFeatured.next([]);
    });

    return this.$newsFeatured.asObservable();
  }

  getCarouselConfig(): Observable<number> {
    return this.httpClient.get<CarouselConfig | null>(`${this.apiUrl}/config/carousel`).pipe(
      map((config) => config?.featuredNewsLimit ?? 5),
      catchError(() => of(5))
    );
  }

  getHomeCategoryConfig(): Observable<{
    primary: PrimaryConfig;
    secondary: SecondaryConfig;
  }> {
    return this.httpClient.get<{
      primary: PrimaryConfig;
      secondary: SecondaryConfig;
    }>(`${this.apiUrl}/config/top-categories`).pipe(
      tap(config => console.log('API: Home Config loaded', config)),
      catchError(err => {
        console.error('API Error: getHomeCategoryConfig failed', err);
        throw err;
      })
    );
  }

  getNewsForCategory(categoryId: number, params?: PaginationParams): Observable<PaginatedResponse<News>> {
    const httpParams = toHttpParams(params);
    return this.httpClient.get<any>(`${this.apiUrl}/news/category/${categoryId}`, { params: httpParams }).pipe(
      map(response => {
        // 1. Caso seja um array puro
        if (Array.isArray(response)) {
          return {
            data: response || [],
            meta: {
              total: response.length,
              page: params?.page || 1,
              limit: params?.limit || response.length,
              lastPage: 1
            }
          };
        }
        
        // 2. Caso seja um objeto paginado, validar se tem .data e normalizar meta se necessário
        if (response && typeof response === 'object') {
          return {
            data: response.data || [],
            meta: {
              total: response.meta?.total ?? response.meta?.totalItems ?? 0,
              page: response.meta?.page ?? response.meta?.currentPage ?? 1,
              limit: response.meta?.limit ?? response.meta?.itemsPerPage ?? 10,
              lastPage: response.meta?.lastPage ?? response.meta?.totalPages ?? 1
            }
          };
        }

        // 3. Caso de fallback (nulo ou formatos inesperados)
        return { 
          data: [], 
          meta: { total: 0, page: 1, limit: 10, lastPage: 0 } 
        };
      }),
      tap(res => console.log(`API: News for category ${categoryId} processed`, res.data?.length)),
      catchError(err => {
        console.error(`API Error: getNewsForCategory failed for ${categoryId}`, err);
        return of({ data: [], meta: { total: 0, page: 1, limit: 10, lastPage: 0 } });
      })
    );
  }

  getLatestNews(): Observable<News[]> {
    if (this.$latestNews.value.length > 0) {
      return this.$latestNews.asObservable();
    }

    firstValueFrom(this.httpClient.get<News[] | PaginatedResponse<News>>(`${this.apiUrl}/news/latest-news`)).then((response) => {
      const news = Array.isArray(response) ? response : response.data;
      console.log('API: Latest News loaded', news.length);
      this.$latestNews.next(news);
    }).catch((err) => {
      console.error('API Error: getLatestNews failed', err);
      this.$latestNews.next([]);
    });

    return this.$latestNews.asObservable();
  }

  getMostViewedNews(): Observable<News[]> {
    return this.httpClient.get<News[] | PaginatedResponse<News>>(`${this.apiUrl}/news/most-viewed`).pipe(
      map(response => Array.isArray(response) ? response : response.data),
      tap(news => console.log('API: Most Viewed loaded', news?.length)),
      catchError(err => {
        console.error('API Error: getMostViewedNews failed', err);
        return of([]);
      })
    );
  }

  getCategoryGrid(): Observable<HomeCategoryGridItem[]> {
    return this.getHomeCategoryConfig().pipe(
      switchMap((config) =>
        forkJoin(
          config.primary.categories.map((category: Category) =>
            this.getNewsForCategory(category.id as number).pipe(
              map((response) => ({
                category,
                news: response.data,
              }))
            )
          )
        ) as Observable<HomeCategoryGridItem[]>
      )
    );
  }

  getHighlights(): Observable<HomeHighlightItem[]> {
    return this.getHomeCategoryConfig().pipe(
      switchMap((config) =>
        forkJoin(
          config.secondary.categories.map((category: Category) =>
            this.getNewsForCategory(category.id as number, { limit: 5 }).pipe(
              map((response) => ({
                category,
                news: response.data,
              }))
            )
          )
        ) as Observable<HomeHighlightItem[]>
      )
    );
  }

  gethighlights(): Observable<HomeHighlightItem[]> {
    return this.getHighlights();
  }

  getNews(params?: PaginationParams): Observable<PaginatedResponse<News>> {
    const httpParams = toHttpParams(params);
    return this.httpClient.get<PaginatedResponse<News>>(`${this.apiUrl}/news`, { params: httpParams });
  }

  getCategories(): Observable<Category[]> {
    return this.httpClient.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getVideosFeatured(): Observable<Video[]> {
    if (this.$videosFeatured.value.length > 0) {
      return this.$videosFeatured.asObservable();
    }

    firstValueFrom(this.httpClient.get<Video[] | PaginatedResponse<Video>>(`${this.apiUrl}/videos/featured`)).then((response) => {
      const videos = Array.isArray(response) ? response : response.data;
      this.$videosFeatured.next(videos);
    }).catch(() => {
      this.$videosFeatured.next([]);
    });

    return this.$videosFeatured.asObservable();
  }

  getVideos(params?: PaginationParams): Observable<PaginatedResponse<Video>> {
    const httpParams = toHttpParams(params);
    return this.httpClient.get<PaginatedResponse<Video>>(`${this.apiUrl}/videos`, { params: httpParams });
  }

  getVideosLatest(): Observable<Video[]> {
    return this.httpClient.get<Video[] | PaginatedResponse<Video>>(`${this.apiUrl}/videos/latest`).pipe(
      map(response => Array.isArray(response) ? response : response.data)
    );
  }

  getVideosByCategory(excludeIds?: number[]): Observable<Video[]> {
    let url = `${this.apiUrl}/videos/by-category`;

    if (excludeIds && excludeIds.length > 0) {
      const idsParam = excludeIds.join(',');
      url += `?excludeIds=${idsParam}`;
    }

    return this.httpClient.get<Video[] | PaginatedResponse<Video>>(url).pipe(
      map(response => Array.isArray(response) ? response : response.data)
    );
  }

  getRelatedNews(newsId: number): Observable<News[]> {
    return this.httpClient.get<News[]>(`${this.apiUrl}/news/related-news/${newsId}`);
  }

  getSocialMedia(): Observable<SocialMediaConfig> {
    return this.httpClient.get<SocialMediaConfig>(`${this.apiUrl}/config/social-media`);
  }
}
