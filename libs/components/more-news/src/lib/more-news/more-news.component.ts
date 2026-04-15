import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { Component, input, signal, OnInit, computed, inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Category, News, PaginationMeta, PaginationParams } from '@site-gazeta/models';
import { EventEmitter, Output } from '@angular/core';
import { ApiConfigService, HomeNewsOrchestratorService } from '@site-gazeta/api';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'lib-more-news',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './more-news.component.html',
  styleUrl: './more-news.component.scss',
})
export class MoreNewsComponent implements OnInit{
  constructor(){
    effect(() => {
      const list = this.newsChecked();
      const currentState = this.imageLoadingState();
      const nextState = { ...currentState } as Record<number, boolean>;
      let hasChange = false;
      list?.forEach((item) => {
        if (nextState[item.id] === undefined) {
          nextState[item.id] = true;
          hasChange = true;
        }
      });
      if (hasChange) {
        this.imageLoadingState.set(nextState);
      }
    });
  }
  private apiConfigService = inject(ApiConfigService);
  private homeOrchestrator = inject(HomeNewsOrchestratorService);
  private readonly platformId = inject(PLATFORM_ID);
  
  // News input from parent
  moreNews = input<News[] | undefined>(undefined);
  paginationMeta = input<PaginationMeta | null>(null);
  
  // Internal state for orchestrator news (Auto-pagination)
  private accumulatedMoreNews = signal<News[]>([]);
  private internalPaginationMeta = signal<PaginationMeta | null>(null);
  
  category = input<Category>();
  slice = input<number>(0);
  showNews = signal<number>(0);
  title = input<string>('Mais notícias');
  
  @Output() loadMoreRequested = new EventEmitter<void>();
  protected imageLoadingState = signal<Record<number, boolean>>({});
  protected isLoadingNextBatch = signal<boolean>(false);

  // Combined news: either from input or internal accumulation
  newsChecked = computed(() => {
    const inputNews = this.moreNews();
    if (inputNews !== undefined) return inputNews;
    return this.accumulatedMoreNews();
  });

  // Meta reference: either from input or internal
  effectiveMeta = computed(() => this.paginationMeta() ?? this.internalPaginationMeta());

  visibleNews = computed(() => {
    const news = this.newsChecked();
    const limit = this.showNews() > 0 ? this.showNews() : news.length;
    return news.slice(0, limit);
  });

  protected hasPendingVisibleImages = computed(() =>
    this.visibleNews().some((item) => this.isImageLoading(item.id))
  );

  protected canLoadMore = computed(() => {
    const currentShow = this.showNews();
    const total = this.newsChecked().length;
    const meta = this.effectiveMeta();
    const hasMorePages = meta ? meta.page < meta.lastPage : false;

    // Tem itens locais não exibidos? (só se slice > 0)
    const hasLocalItems = this.slice() > 0 && currentShow > 0 && currentShow < total;

    // Mostra o botão se: tem itens ocultos OU tem mais páginas OU está carregando
    return hasLocalItems || hasMorePages || this.isLoadingNextBatch();
  });

  currentCategory = computed(() =>{
    const category = this.category();
    return category || null;
  });

  ngOnInit(): void {
    this.sliceNews();
    
    // Se não recebeu notícias via input, inicializa a busca via orquestrador
    if (this.moreNews() === undefined) {
      this.loadInitialOrchestratorNews();
    }
  }

  private loadInitialOrchestratorNews() {
    this.isLoadingNextBatch.set(true);
    this.homeOrchestrator.getFilteredMoreNews({ page: 1 })
      .subscribe({
        next: (response) => {
          this.accumulatedMoreNews.set(response.data);
          this.internalPaginationMeta.set(response.meta);
          this.isLoadingNextBatch.set(false);
        },
        error: () => this.isLoadingNextBatch.set(false)
      });
  }

  sliceNews(){
    const sliceValue = this.slice();
    if(sliceValue){
      this.showNews.set(sliceValue);
    }
  }

  private prefetchNextPage() {
    // Se já estamos carregando (seja pre-fetch ou batch), ignora
    // Nota: isLoadingNextBatch é usado para o feedback visual do botão.
    // O pre-fetch é silencioso, mas evitamos chamadas duplicadas.
    
    // Modo Pai (Categoria/Busca): emite evento para o pai buscar
    if (this.paginationMeta()) {
      this.loadMoreRequested.emit();
      return;
    }

    // Modo Autônomo (Home): busca internamente via orquestrador
    const meta = this.internalPaginationMeta();
    if (!meta || meta.page >= meta.lastPage) return;

    const nextPage = meta.page + 1;
    this.homeOrchestrator.getFilteredMoreNews({ page: nextPage })
      .subscribe({
        next: (response) => {
          this.accumulatedMoreNews.update(current => [...current, ...response.data]);
          this.internalPaginationMeta.set(response.meta);
        },
        error: (err) => console.error('Erro ao pré-buscar página:', err)
      });
  }

  async showMoreNews() {
    const step = this.slice() || 3;

    // ─── CASO ESPECIAL: Busca (slice=0, sem slicing local) ───
    // Mostra tudo de uma vez, botão serve apenas para buscar mais páginas
    if (this.slice() === 0 && this.paginationMeta()) {
      this.loadMoreRequested.emit();
      return;
    }

    // ─── PASSO 1: Expandir o slice local ───
    const currentShow = this.showNews();
    const totalLoaded = this.newsChecked().length;
    const nextShow = currentShow + step;
    
    // Preparar o próximo batch para preload de imagens
    const news = this.newsChecked();
    const nextBatch = news.slice(currentShow, nextShow);
    
    if (nextBatch.length > 0 && isPlatformBrowser(this.platformId)) {
      this.isLoadingNextBatch.set(true);
      try {
        await Promise.all(nextBatch.map(n => this.preloadNewsImage(n)));
        
        // Marca imagens como carregadas (isso atualiza se o skeleton aparece ou não)
        this.imageLoadingState.update(state => {
          const next = { ...state } as Record<number, boolean>;
          nextBatch.forEach(item => { next[item.id] = false; });
          return next;
        });
      } finally {
        this.isLoadingNextBatch.set(false);
      }
    }
    
    // Incrementa a visibilidade
    this.showNews.set(nextShow);

    // ─── PASSO 2: Verificar se precisa pré-buscar a próxima página ───
    const remainingInBuffer = totalLoaded - nextShow;
    const meta = this.effectiveMeta();
    const hasMorePages = meta ? meta.page < meta.lastPage : false;

    // Se estamos perto de acabar os itens carregados e existem mais páginas, dispara pre-fetch
    if (remainingInBuffer <= step && hasMorePages) {
      this.prefetchNextPage();
    }
  }

  protected isImageLoading(newsId: number): boolean {
    return this.imageLoadingState()[newsId] ?? true;
  }

  protected handleImageLoaded(newsId: number): void {
    this.updateImageLoadingState(newsId, false);
  }

  protected handleImageError(newsId: number): void {
    this.updateImageLoadingState(newsId, false);
  }

  private updateImageLoadingState(newsId: number, isLoading: boolean): void {
    this.imageLoadingState.update((state) => ({
      ...state,
      [newsId]: isLoading,
    }));
  }

  private preloadNewsImage(newsItem: News): Promise<void> {
    const imageUrl = newsItem.mediaNews?.[0]?.imgSize?.small || newsItem.mediaNews?.[0]?.imgSize?.original;

    if (!imageUrl) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = imageUrl;
    });
  }
}
