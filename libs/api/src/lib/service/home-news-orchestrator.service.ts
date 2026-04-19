import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, tap, shareReplay, catchError } from 'rxjs/operators';
import { Category, News, PaginatedResponse, PaginationParams, NewsMedia } from '@site-gazeta/models';
import {
  ApiConfigService,
  HomeCategoryGridItem,
  HomeHighlightItem,
} from './api-config.service';

// TTL de 5 minutos para cache (em ms)
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface HomeCategoryConfig {
  primary: {
    categories: Category[];
  };
  secondary: {
    categories: Category[];
  };
}

/**
 * Serviço responsável por orquestrar o carregamento das listagens de notícias da Home Page.
 * Padrão BFF (Backend for Frontend) em memória.
 * Evita a "Race Condition" de chamadas assíncronas concorrentes garantindo que
 * o filtro de exclusões ocorra em RAM e de forma hierárquica.
 *
 * Arquitetura de performance:
 * 1. Cache da config (1 requisição para PRIMARY + SECONDARY)
 * 2. ForkJoin paralelo - todas as categorias em paralelo (ordem preservada pelo array)
 * 3. Cache TTL de 5 minutos para todas as seções
 * 4. Reutilização da config cacheada
 *
 * O SSR hydration é tratado automaticamente pelo provideClientHydration()
 * com withHttpTransferCacheOptions() no app.config.ts
 */
@Injectable({
  providedIn: 'root',
})
export class HomeNewsOrchestratorService {
  private apiConfigService = inject(ApiConfigService);

  // Armazenamento central dos IDs das notícias já alocadas na Home para evitar duplicatas.
  private globalExcludedIds = new Set<number>();

  // ✅ Cache da CONFIG (1x para PRIMARY + SECONDARY)
  private homeConfigCache$?: Observable<HomeCategoryConfig>;
  private homeConfigCacheEntry?: CacheEntry<HomeCategoryConfig>;

  // ✅ Caches de notícias com TTL
  private carouselCache$?: Observable<News[]>;
  private carouselCacheEntry?: CacheEntry<News[]>;
  private gridCache$?: Observable<HomeCategoryGridItem[]>;
  private gridCacheEntry?: CacheEntry<HomeCategoryGridItem[]>;
  private highlightsCache$?: Observable<HomeHighlightItem[]>;
  private highlightsCacheEntry?: CacheEntry<HomeHighlightItem[]>;

  /**
   * Verifica se cache ainda é válido
   */
  private isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  }

  /**
   * Obtem a config cacheada (chamada UNA para PRIMARY + SECONDARY)
   */
  private getHomeConfig(): Observable<HomeCategoryConfig> {
    if (
      this.homeConfigCacheEntry &&
      this.isCacheValid(this.homeConfigCacheEntry)
    ) {
      return of(this.homeConfigCacheEntry.data);
    }

    this.homeConfigCache$ = this.apiConfigService.getHomeCategoryConfig().pipe(
      tap((config) => {
        this.homeConfigCacheEntry = { data: config, timestamp: Date.now() };
      }),
      shareReplay(1),
    );
    return this.homeConfigCache$;
  }

  /**
   * Passo 1 da Hierarquia: Notícias Principais (Carousel/Hero)
   * ✅ Com cache TTL
   */
  getCarouselNews(): Observable<News[]> {
    if (this.carouselCacheEntry && this.isCacheValid(this.carouselCacheEntry)) {
      return of(this.carouselCacheEntry.data);
    }

    this.carouselCache$ = this.apiConfigService.getNewsFeatured().pipe(
      map(news => this.normalizeNewsMedia(news)),
      tap((news) => {
        this.registerIds(news);
        this.carouselCacheEntry = { data: news, timestamp: Date.now() };
      }),
      shareReplay(1),
    );
    return this.carouselCache$;
  }

  /**
   * Passo 2 da Hierarquia: Categoria Grid (Abaixo do Carousel)
   * ✅ Utiliza config cacheada + forkJoin paralelo + cache TTL
   */
  getCategoryGrid(): Observable<HomeCategoryGridItem[]> {
    if (this.gridCacheEntry && this.isCacheValid(this.gridCacheEntry)) {
      return of(this.gridCacheEntry.data);
    }

    this.gridCache$ = this.getHomeConfig().pipe(
      switchMap((config) => {
        if (!config?.primary?.categories?.length) {
          return of([]);
        }

        // ✅ FORKJOIN paralelo - mantém ordem do array original
        return forkJoin(
          config.primary.categories.map((category: Category) =>
            this.fetchAndFilterNews(category.id as number).pipe(
              map((news) => ({ category, news })),
            ),
          ),
        );
      }),
      map(
        (items) =>
          (Array.isArray(items) ? items : []) as HomeCategoryGridItem[],
      ),
      tap((items) => {
        this.gridCacheEntry = { data: items, timestamp: Date.now() };
      }),
      catchError((err) => {
        console.error('Orchestrator Error: getCategoryGrid failed', err);
        return of([]);
      }),
      shareReplay(1),
    );
    return this.gridCache$;
  }

  /**
   * Passo 3 da Hierarquia: Categoria Secundária (Highlights)
   * ✅ Utiliza a MESMA config cacheada + forkJoin paralelo + cache TTL
   */
  getHighlights(): Observable<HomeHighlightItem[]> {
    if (
      this.highlightsCacheEntry &&
      this.isCacheValid(this.highlightsCacheEntry)
    ) {
      return of(this.highlightsCacheEntry.data);
    }

    this.highlightsCache$ = this.getHomeConfig().pipe(
      switchMap((config) => {
        if (!config?.secondary?.categories?.length) {
          return of([]);
        }

        // ✅ REUTILIZA a config cacheada (não faz nova chamada)
        return forkJoin(
          config.secondary.categories.map((category: Category) =>
            this.fetchAndFilterNews(category.id as number, 5).pipe(
              map((news) => ({ category, news })),
            ),
          ),
        );
      }),
      map(
        (items) => (Array.isArray(items) ? items : []) as HomeHighlightItem[],
      ),
      tap((items) => {
        this.highlightsCacheEntry = { data: items, timestamp: Date.now() };
      }),
      catchError((err) => {
        console.error('Orchestrator Error: getHighlights failed', err);
        return of([]);
      }),
      shareReplay(1),
    );
    return this.highlightsCache$;
  }

  /**
   * Traz as últimas notícias mais gerais, filtrando tudo o que os cabeçalhos
   * acima já carregaram e registraram no exclude global.
   */
  getFilteredMoreNews(params?: PaginationParams): Observable<PaginatedResponse<News>> {
    const excludes = Array.from(this.globalExcludedIds).join(',');

    return this.apiConfigService.getNews({ ...params, exclude: excludes }).pipe(
      map(response => ({
        ...response,
        data: this.normalizeNewsMedia(response.data)
      })),
      catchError(() => of({ data: [], meta: { total: 0, page: 1, limit: 10, lastPage: 0 } })),
    );
  }

  /**
   * Módulo Core de Filtragem Hierárquica em Memória
   * @param categoryId ID da categoria a puxar
   * @param limit Limite máximo de amostragem após filtro
   */
  private fetchAndFilterNews(
    categoryId: number,
    limit?: number,
  ): Observable<News[]> {
    const localExcludes = Array.from(this.globalExcludedIds).join(',');

    return this.apiConfigService
      .getNewsForCategory(categoryId, { exclude: localExcludes })
      .pipe(
        map((response) => this.normalizeNewsMedia(response.data)),
        tap((news) => {
          this.registerIds(news);
        }),
        map((news) => {
          const safeNews = news || [];
          return limit ? safeNews.slice(0, limit) : safeNews;
        }),
        catchError((err) => {
          console.error(
            `Orchestrator Error: fetchAndFilterNews failed for Category ${categoryId}`,
            err,
          );
          return of([]);
        }),
      );
  }

  /**
   * Normaliza o array de mídias para garantir que a mídia com destaque (emphasis: true)
   * seja sempre a primeira (posição 0) e que exista pelo menos um fallback seguro.
   */
  private normalizeNewsMedia(newsItems: News[]): News[] {
    return (newsItems || []).map(news => {
      const mediaList = news.mediaNews ? [...news.mediaNews] : [];
      let emphasisMedia = mediaList.find(m => m.emphasis && m.imgSize);

      if (!emphasisMedia) {
        emphasisMedia = mediaList.find(m => m.imgSize);
      }

      if (emphasisMedia) {
        return {
          ...news,
          mediaNews: [
            emphasisMedia,
            ...mediaList.filter(m => m !== emphasisMedia)
          ]
        };
      }

      const placeholderMedia = {
        emphasis: true,
        imgSize: {
          small: '',
          medium: '',
          original: '',
          superSmall: ''
        }
      } as NewsMedia;

      return {
        ...news,
        mediaNews: [placeholderMedia]
      };
    });
  }

  /**
   * Registra array de notícias ativas no Store para não repetirem
   */
  private registerIds(newsItems: News[]): void {
    if (!newsItems || newsItems.length === 0) return;
    newsItems.forEach((n) => {
      if (n && n.id) this.globalExcludedIds.add(n.id);
    });
  }

  /**
   * Zera Cache e Store na navegação ou init
   */
  resetStore(): void {
    this.globalExcludedIds.clear();
    this.homeConfigCache$ = undefined;
    this.homeConfigCacheEntry = undefined;
    this.carouselCache$ = undefined;
    this.carouselCacheEntry = undefined;
    this.gridCache$ = undefined;
    this.gridCacheEntry = undefined;
    this.highlightsCache$ = undefined;
    this.highlightsCacheEntry = undefined;
  }
}
