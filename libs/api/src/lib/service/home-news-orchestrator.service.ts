import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, tap, shareReplay, catchError } from 'rxjs/operators';
import { Category, News, PaginatedResponse } from '@site-gazeta/models';
import { ApiConfigService, HomeCategoryGridItem, HomeHighlightItem } from './api-config.service';

/**
 * Serviço responsável por orquestrar o carregamento das listagens de notícias da Home Page.
 * Padrão BFF (Backend for Frontend) em memória.
 * Evita a "Race Condition" de chamadas assíncronas concorrentes garantindo que
 * o filtro de exclusões ocorra em RAM e de forma hierárquica.
 */
@Injectable({
  providedIn: 'root'
})
export class HomeNewsOrchestratorService {
  private apiConfigService = inject(ApiConfigService);

  // Armazenamento central dos IDs das notícias já alocadas na Home para evitar duplicatas.
  private globalExcludedIds = new Set<number>();

  // Caches de Observables (ShareReplay) garantem que requisições múltiplas de 
  // um mesmo componente usem o mesmo fluxo já resolvido na memória.
  private carouselCache$?: Observable<News[]>;
  private gridCache$?: Observable<HomeCategoryGridItem[]>;
  private highlightsCache$?: Observable<HomeHighlightItem[]>;

  /**
   * Passo 1 da Hierarquia: Notícias Principais (Carousel/Hero)
   */
  getCarouselNews(): Observable<News[]> {
    if (!this.carouselCache$) {
      this.carouselCache$ = this.apiConfigService.getNewsFeatured().pipe(
        tap(news => this.registerIds(news)),
        shareReplay(1)
      );
    }
    return this.carouselCache$;
  }

  /**
   * Passo 2 da Hierarquia: Categoria Grid (Abaixo do Carousel)
   * Observação: O Grid precisa ignorar o que já foi pro Carousel.
   */
  getCategoryGrid(): Observable<HomeCategoryGridItem[]> {
    if (!this.gridCache$) {
      this.gridCache$ = this.apiConfigService.getHomeCategoryConfig().pipe(
        switchMap(config => {
          console.log('Orchestrator: Processing Category Grid', config?.primary?.categories?.length);
          if (!config || !config.primary || !config.primary.categories) return of([]);
          return forkJoin(
            config.primary.categories.map((category: Category) =>
              this.fetchAndFilterNews(category.id as number)
                .pipe(map((news) => ({ category, news })))
            )
          );
        }),
        tap(grid => console.log('Orchestrator: Grid Loaded', grid.length)),
        catchError(err => {
          console.error('Orchestrator Error: getCategoryGrid failed', err);
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.gridCache$;
  }

  /**
   * Passo 3 da Hierarquia: Categoria Secundária (Highlights)
   */
  getHighlights(): Observable<HomeHighlightItem[]> {
    if (!this.highlightsCache$) {
      this.highlightsCache$ = this.apiConfigService.getHomeCategoryConfig().pipe(
        switchMap(config => {
          console.log('Orchestrator: Processing Highlights', config?.secondary?.categories?.length);
          if (!config || !config.secondary || !config.secondary.categories) return of([]);
          return forkJoin(
            config.secondary.categories.map((category: Category) =>
              this.fetchAndFilterNews(category.id as number, 5) // Limitado a 5 por escopo anterior
                .pipe(map((news) => ({ category, news })))
            )
          );
        }),
        tap(highlights => console.log('Orchestrator: Highlights Loaded', highlights.length)),
        catchError(err => {
          console.error('Orchestrator Error: getHighlights failed', err);
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.highlightsCache$;
  }

  /**
   * Traz as últimas notícias mais gerais, filtrando tudo o que os cabeçalhos 
   * acima já carregaram e registraram no exclude global.
   */
  getFilteredMoreNews(): Observable<News[]> {
    const excludes = Array.from(this.globalExcludedIds).join(',');
    
    // Reutiliza o método getNews da lib passando exclude
    return this.apiConfigService.getNews({ exclude: excludes }).pipe(
      map(response => response.data),
      catchError(() => of([]))
    );
  }

  /**
   * Módulo Core de Filtragem Hierárquica em Memória
   * @param categoryId ID da categoria a puxar
   * @param limit Limite máximo de amostragem após filtro
   */
  private fetchAndFilterNews(categoryId: number, limit?: number): Observable<News[]> {
    const localExcludes = Array.from(this.globalExcludedIds).join(',');

    return this.apiConfigService.getNewsForCategory(categoryId, { exclude: localExcludes }).pipe(
      map(response => response.data),
      tap(news => {
        console.log(`Orchestrator: Fetched ${news?.length} news for Category ${categoryId} (Excludes: ${this.globalExcludedIds.size})`);
        this.registerIds(news);
      }),
      map(news => {
        const safeNews = news || [];
        return limit ? safeNews.slice(0, limit) : safeNews;
      }),
      catchError(err => {
        console.error(`Orchestrator Error: fetchAndFilterNews failed for Category ${categoryId}`, err);
        return of([]);
      })
    );
  }

  /**
   * Registra array de notícias ativas no Store para não repetirem
   */
  private registerIds(newsItems: News[]): void {
    if (!newsItems || newsItems.length === 0) return;
    newsItems.forEach(n => {
      if (n && n.id) this.globalExcludedIds.add(n.id);
    });
  }

  /**
   * Zera Cache e Store na navegação ou init
   */
  resetStore(): void {
    this.globalExcludedIds.clear();
    this.carouselCache$ = undefined;
    this.gridCache$ = undefined;
    this.highlightsCache$ = undefined;
  }
}
