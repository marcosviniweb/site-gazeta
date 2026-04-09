import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, switchMap, tap, shareReplay, catchError } from 'rxjs/operators';
import { Category, News } from '@site-gazeta/models';
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
          if (!config || !config.primary || !config.primary.categories) return of([]);
          return forkJoin(
            config.primary.categories.map((category: Category) =>
              this.fetchAndFilterNews(category.id as number)
                .pipe(map((news) => ({ category, news })))
            )
          );
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
          if (!config || !config.secondary || !config.secondary.categories) return of([]);
          return forkJoin(
            config.secondary.categories.map((category: Category) =>
              this.fetchAndFilterNews(category.id as number, 5) // Limitado a 5 por escopo anterior
                .pipe(map((news) => ({ category, news })))
            )
          );
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
    // Nós podemos adicionar o parâmetro "exclude" nativamente na request do backend,
    // ou pegar as recém fetchadas ignorando a RAM.
    const excludes = Array.from(this.globalExcludedIds).join(',');
    
    // Fazemos um catch all pegando direto da API passando a string dos IDs registrados até o momento
    // Reutiliza endpoint GET /news genérico provido no ApiConfigService
    return this.apiConfigService['httpClient'].get<News[]>(
      `${this.apiConfigService['apiUrl']}/news`, 
      { params: { exclude: excludes } }
    ).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Módulo Core de Filtragem Hierárquica em Memória
   * @param categoryId ID da categoria a puxar
   * @param limit Limite máximo de amostragem após filtro
   */
  private fetchAndFilterNews(categoryId: number, limit?: number): Observable<News[]> {
    // Como queremos evitar Request Race Condition, forçamos que essa chamada à API 
    // passe o "exclude" local preenchido ATÉ QUANDO essa request for MONTADA!
    const localExcludes = Array.from(this.globalExcludedIds).join(',');

    return this.apiConfigService['httpClient'].get<News[]>(
      `${this.apiConfigService['apiUrl']}/news/category/${categoryId}`,
      { params: { exclude: localExcludes } } // Bypass no interceptor antigo
    ).pipe(
      tap(news => this.registerIds(news)),
      map(news => limit ? news.slice(0, limit) : news),
      catchError(() => of([]))
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
