import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  firstValueFrom,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import {
  Category,
  News,
  PrimaryConfig,
  SecondaryConfig,
  Video,
  SocialMediaConfig,
  PaginatedResponse,
  PaginationParams,
  NewsMedia,
} from '@site-gazeta/models';
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

    firstValueFrom(
      this.httpClient.get<News[] | PaginatedResponse<News>>(
        `${this.apiUrl}/news/featured`,
      ),
    )
      .then((response) => {
        const news = Array.isArray(response) ? response : response.data;
        this.$newsFeatured.next(this.normalizeNewsMedia(news));
      })
      .catch((err) => {
        console.error('API Error: getNewsFeatured failed', err);
        this.$newsFeatured.next([]);
      });

    return this.$newsFeatured.asObservable();
  }

  getCarouselConfig(): Observable<number> {
    return this.httpClient
      .get<CarouselConfig | null>(`${this.apiUrl}/config/carousel`)
      .pipe(
        map((config) => config?.featuredNewsLimit ?? 5),
        catchError(() => of(5)),
      );
  }

  getHomeCategoryConfig(): Observable<{
    primary: PrimaryConfig;
    secondary: SecondaryConfig;
  }> {
    return this.httpClient
      .get<{
        primary: PrimaryConfig;
        secondary: SecondaryConfig;
      }>(`${this.apiUrl}/config/top-categories`)
      .pipe(
        catchError((err) => {
          console.error('API Error: getHomeCategoryConfig failed', err);
          throw err;
        }),
      );
  }

  getNewsForCategory(
    categoryId: number,
    params?: PaginationParams,
  ): Observable<PaginatedResponse<News>> {
    const httpParams = toHttpParams(params);
    return this.httpClient
      .get<any>(`${this.apiUrl}/news/category/${categoryId}`, {
        params: httpParams,
      })
      .pipe(
        map((response) => {
          // 1. Caso seja um array puro
          if (Array.isArray(response)) {
            return {
              data: response || [],
              meta: {
                total: response.length,
                page: params?.page || 1,
                limit: params?.limit || response.length,
                lastPage: 1,
              },
            };
          }

          // 2. Caso seja um objeto paginado, validar se tem .data e normalizar meta se necessário
          if (response && typeof response === 'object') {
            return {
              data: this.normalizeNewsMedia(response.data || []),
              meta: {
                total: response.meta?.total ?? response.meta?.totalItems ?? 0,
                page: response.meta?.page ?? response.meta?.currentPage ?? 1,
                limit:
                  response.meta?.limit ?? response.meta?.itemsPerPage ?? 10,
                lastPage:
                  response.meta?.lastPage ?? response.meta?.totalPages ?? 1,
              },
            };
          }

          // 3. Caso de fallback (nulo ou formatos inesperados)
          return {
            data: [],
            meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
          };
        }),
        catchError((err) => {
          console.error(
            `API Error: getNewsForCategory failed for ${categoryId}`,
            err,
          );
          return of({
            data: [],
            meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
          });
        }),
      );
  }

  getLatestNews(): Observable<News[]> {
    if (this.$latestNews.value.length > 0) {
      return this.$latestNews.asObservable();
    }

    firstValueFrom(
      this.httpClient.get<News[] | PaginatedResponse<News>>(
        `${this.apiUrl}/news/latest-news`,
      ),
    )
      .then((response) => {
        const news = Array.isArray(response) ? response : response.data;
        this.$latestNews.next(this.normalizeNewsMedia(news));
      })
      .catch((err) => {
        console.error('API Error: getLatestNews failed', err);
        this.$latestNews.next([]);
      });

    return this.$latestNews.asObservable();
  }

  getMostViewedNews(): Observable<News[]> {
    return this.httpClient
      .get<News[] | PaginatedResponse<News>>(`${this.apiUrl}/news/most-viewed`)
      .pipe(
        map((response) => this.normalizeNewsMedia(Array.isArray(response) ? response : response.data)),
        catchError((err) => {
          console.error('API Error: getMostViewedNews failed', err);
          return of([]);
        }),
      );
  }

  getCategoryGrid(): Observable<HomeCategoryGridItem[]> {
    return this.getHomeCategoryConfig().pipe(
      switchMap(
        (config) =>
          forkJoin(
            config.primary.categories.map((category: Category) =>
              this.getNewsForCategory(category.id as number).pipe(
                map((response) => ({
                  category,
                  news: response.data,
                })),
              ),
            ),
          ) as Observable<HomeCategoryGridItem[]>,
      ),
    );
  }

  getHighlights(): Observable<HomeHighlightItem[]> {
    return this.getHomeCategoryConfig().pipe(
      switchMap(
        (config) =>
          forkJoin(
            config.secondary.categories.map((category: Category) =>
              this.getNewsForCategory(category.id as number, { limit: 5 }).pipe(
                map((response) => ({
                  category,
                  news: response.data,
                })),
              ),
            ),
          ) as Observable<HomeHighlightItem[]>,
      ),
    );
  }

  gethighlights(): Observable<HomeHighlightItem[]> {
    return this.getHighlights();
  }

  getNews(params?: PaginationParams): Observable<PaginatedResponse<News>> {
    const httpParams = toHttpParams(params);
    return this.httpClient.get<PaginatedResponse<News>>(`${this.apiUrl}/news`, {
      params: httpParams,
    }).pipe(
      map(response => ({
        ...response,
        data: this.normalizeNewsMedia(response.data)
      }))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.httpClient.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getVideosFeatured(): Observable<Video[]> {
    if (this.$videosFeatured.value.length > 0) {
      return this.$videosFeatured.asObservable();
    }

    firstValueFrom(
      this.httpClient.get<Video[] | PaginatedResponse<Video>>(
        `${this.apiUrl}/videos/featured`,
      ),
    )
      .then((response) => {
        const videos = Array.isArray(response) ? response : response.data;
        this.$videosFeatured.next(videos);
      })
      .catch(() => {
        this.$videosFeatured.next([]);
      });

    return this.$videosFeatured.asObservable();
  }

  getVideos(params?: PaginationParams): Observable<PaginatedResponse<Video>> {
    const httpParams = toHttpParams(params);
    return this.httpClient.get<PaginatedResponse<Video>>(
      `${this.apiUrl}/videos`,
      { params: httpParams },
    );
  }

  getVideosLatest(): Observable<Video[]> {
    return this.httpClient
      .get<Video[] | PaginatedResponse<Video>>(`${this.apiUrl}/videos/latest`)
      .pipe(
        map((response) => (Array.isArray(response) ? response : response.data)),
      );
  }

  getVideosByCategory(excludeIds?: number[]): Observable<Video[]> {
    let url = `${this.apiUrl}/videos/by-category`;

    if (excludeIds && excludeIds.length > 0) {
      const idsParam = excludeIds.join(',');
      url += `?excludeIds=${idsParam}`;
    }

    return this.httpClient
      .get<Video[] | PaginatedResponse<Video>>(url)
      .pipe(
        map((response) => (Array.isArray(response) ? response : response.data)),
      );
  }

  getRelatedNews(newsId: number): Observable<News[]> {
    return this.httpClient.get<News[]>(
      `${this.apiUrl}/news/related-news/${newsId}`,
    ).pipe(
      map(news => this.normalizeNewsMedia(news))
    );
  }

  getSocialMedia(): Observable<SocialMediaConfig> {
    return this.httpClient.get<SocialMediaConfig>(
      `${this.apiUrl}/config/social-media`,
    );
  }

  /**
   * Normaliza o array de mídias para garantir que a mídia com destaque (emphasis: true)
   * seja sempre a primeira (posição 0) e que exista pelo menos um fallback seguro.
   */
  private normalizeNewsMedia(newsItems: News[]): News[] {
    return (newsItems || []).map((news) => {
      const mediaList = news.mediaNews ? [...news.mediaNews] : [];
      let emphasisMedia = mediaList.find((m) => m.emphasis && m.imgSize);

      if (!emphasisMedia) {
        emphasisMedia = mediaList.find((m) => m.imgSize);
      }

      if (emphasisMedia) {
        return {
          ...news,
          mediaNews: [
            emphasisMedia,
            ...mediaList.filter((m) => m !== emphasisMedia),
          ],
        };
      }

      const placeholderMedia = {
        emphasis: true,
        imgSize: {
          small: '',
          medium: '',
          original: '',
          superSmall: '',
        },
      } as NewsMedia;

      return {
        ...news,
        mediaNews: [placeholderMedia],
      };
    });
  }
}
