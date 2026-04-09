import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, forkJoin, map, of, switchMap } from 'rxjs';
import { Category, News, PrimaryConfig, SecondaryConfig, Video } from '@site-gazeta/models';
import { LIBRARY_CONFIG } from '../config/api-config';

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

    firstValueFrom(this.httpClient.get<News[]>(`${this.apiUrl}/news/featured`)).then((news) => {
      this.$newsFeatured.next(news);
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
    }>(`${this.apiUrl}/config/top-categories`);
  }

  getNewsForCategory(categoryId: number): Observable<News[]> {
    return this.httpClient.get<News[]>(`${this.apiUrl}/news/category/${categoryId}`);
  }

  getLatestNews(): Observable<News[]> {
    if (this.$latestNews.value.length > 0) {
      return this.$latestNews.asObservable();
    }

    firstValueFrom(this.httpClient.get<News[]>(`${this.apiUrl}/news/latest-news`)).then((news) => {
      this.$latestNews.next(news);
    });

    return this.$latestNews.asObservable();
  }

  getMostViewedNews(): Observable<News[]> {
    return this.httpClient.get<News[]>(`${this.apiUrl}/news/most-viewed`);
  }

  getCategoryGrid(): Observable<HomeCategoryGridItem[]> {
    return this.getHomeCategoryConfig().pipe(
      switchMap((config) =>
        forkJoin(
          config.primary.categories.map((category: Category) =>
            this.getNewsForCategory(category.id as number).pipe(
              map((news) => ({
                category,
                news,
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
            this.getNewsForCategory(category.id as number).pipe(
              map((news) => ({
                category,
                news: news.slice(0, 5),
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

  getNews(): Observable<News[]> {
    return this.httpClient.get<News[]>(`${this.apiUrl}/news`);
  }

  getCategories(): Observable<Category[]> {
    return this.httpClient.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getVideosFeatured(): Observable<Video[]> {
    if (this.$videosFeatured.value.length > 0) {
      return this.$videosFeatured.asObservable();
    }

    firstValueFrom(this.httpClient.get<Video[]>(`${this.apiUrl}/videos/featured`)).then((videos) => {
      this.$videosFeatured.next(videos);
    });

    return this.$videosFeatured.asObservable();
  }

  getVideos(): Observable<Video[]> {
    return this.httpClient.get<Video[]>(`${this.apiUrl}/videos`);
  }

  getVideosLatest(): Observable<Video[]> {
    return this.httpClient.get<Video[]>(`${this.apiUrl}/videos/latest`);
  }

  getVideosByCategory(excludeIds?: number[]): Observable<Video[]> {
    let url = `${this.apiUrl}/videos/by-category`;

    if (excludeIds && excludeIds.length > 0) {
      const idsParam = excludeIds.join(',');
      url += `?excludeIds=${idsParam}`;
    }

    return this.httpClient.get<Video[]>(url);
  }

  getRelatedNews(newsId: number): Observable<News[]> {
    return this.httpClient.get<News[]>(`${this.apiUrl}/news/related-news/${newsId}`);
  }

  getSocialMedia(): Observable<Record<string, string>> {
    return this.httpClient.get<Record<string, string>>(`${this.apiUrl}/config/social-media`);
  }
}
