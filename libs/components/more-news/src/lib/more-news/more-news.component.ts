import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { Component, input, signal, OnInit, computed, inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Category, News, PaginationMeta } from '@site-gazeta/models';
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
  $moreNews = toSignal(this.homeOrchestrator.getFilteredMoreNews(), { initialValue: [] as News[] });
  moreNews = input<News[] | undefined>(undefined);
  paginationMeta = input<PaginationMeta | null>(null);
  category = input<Category>();
  slice = input<number>(0);
  showNews = signal<number>(0);
  title = input<string>('Mais notícias');
  
  @Output() loadMoreRequested = new EventEmitter<void>();
  protected imageLoadingState = signal<Record<number, boolean>>({});
  protected isLoadingNextBatch = signal<boolean>(false);

  visibleNews = computed(() => {
    const news = this.newsChecked() || [];
    const limit = this.showNews() > 0 ? this.showNews() : news.length;
    return news.slice(0, limit);
  });

  protected hasPendingVisibleImages = computed(() =>
    this.visibleNews().some((item) => this.isImageLoading(item.id))
  );

  protected canLoadMore = computed(() => {
    // Se temos meta de paginação, usamos para decidir se pode carregar mais do backend
    const meta = this.paginationMeta();
    if (meta) {
      return meta.page < meta.lastPage;
    }

    // Caso contrário, cai na lógica antiga de slice local
    const total = (this.newsChecked() || []).length;
    return this.slice() > 0 && this.showNews() < total;
  });

  newsChecked = computed(() => this.moreNews() ?? this.$moreNews());
  currentCategory = computed(() =>{
    const category = this.category();
    if(category){
      return category;
    }
    return null;

  });
  ngOnInit(): void {
    this.sliceNews();

  }



  sliceNews(){
    const sliceValue = this.slice();
    if(sliceValue){
      this.showNews.set(sliceValue);
    }
  }
  async showMoreNews() {
    // Se temos meta de paginação, emitimos o evento para carregar mais do backend
    if (this.paginationMeta()) {
      this.loadMoreRequested.emit();
      return;
    }

    // Lógica antiga para slice local
    if (this.hasPendingVisibleImages()) {
      return;
    }

    if (!this.canLoadMore()) {
      return;
    }

    const news = this.newsChecked() || [];
    const currentVisible = this.showNews() > 0 ? this.showNews() : news.length;
    const nextLimit = Math.min(currentVisible + 3, news.length);
    const nextBatch = news.slice(currentVisible, nextLimit);

    if (nextBatch.length === 0) {
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      this.showNews.set(nextLimit);
      return;
    }

    this.isLoadingNextBatch.set(true);

    try {
      await Promise.all(nextBatch.map((newsItem) => this.preloadNewsImage(newsItem)));

      this.imageLoadingState.update((state) => {
        const nextState = { ...state };

        nextBatch.forEach((item) => {
          nextState[item.id] = false;
        });

        return nextState;
      });

      this.showNews.set(nextLimit);
    } finally {
      this.isLoadingNextBatch.set(false);
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
