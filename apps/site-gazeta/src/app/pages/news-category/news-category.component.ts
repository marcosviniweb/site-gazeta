import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ApiService } from '../../core/service/api.service';
import { AnalyticsService } from '../../core/service/analytics.service';
import { SessionService } from '../../core/service/session.service';
import { Category, News } from '@site-gazeta/models';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MoreNewsComponent } from '@site-gazeta/more-news';

type NewsLayout = 'single' | 'double' | 'multiple';

interface NewsCard {
  id: number;
  title: string;
  slug: string;
  mediaNews: any[];
  createdAt: string;
}

@Component({
  selector: 'app-news-category',
  imports: [CommonModule, RouterLink, MoreNewsComponent, NgOptimizedImage],
  templateUrl: './news-category.component.html',
  styleUrl: './news-category.component.scss',
})
export class NewsCategoryComponent implements OnInit {
  private apiService = inject(ApiService);
  private analyticsService = inject(AnalyticsService);
  private sessionService = inject(SessionService);
  private router = inject(ActivatedRoute);

  protected category = signal<Category | null>(null);
  protected news = signal<News[]>([]);
  protected isLoading = signal<boolean>(true);
  protected imageLoadingState = signal<Record<number, boolean>>({});
  protected paginationMeta = signal<any>(null);

  protected newsLayout = computed<NewsLayout>(() => {
    const count = this.news().length;
    if (count === 0) return 'single';
    if (count === 1) return 'single';
    if (count === 2) return 'double';
    return 'multiple';
  });

  // Para layout double: mainNews = primeira, secondaryNews = segunda
  protected newsForDouble = computed<{
    main: News | null;
    secondary: News | null;
  }>(() => {
    const sorted = this.sortedNews();
    return {
      main: sorted[0] || null,
      secondary: sorted[1] || null,
    };
  });

  protected mainNews = computed<News | null>(() => {
    const sorted = this.sortedNews();
    return sorted.length > 0 ? sorted[0] : null;
  });

  protected secondaryNews = computed<News[]>(() => {
    return this.sortedNews().slice(1, 3);
  });

  protected remainingNews = computed<News[]>(() => {
    return this.sortedNews().slice(3);
  });

  private sortedNews = computed(() => {
    return [...this.news()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  ngOnInit(): void {
    this.getSlug();
  }

  getSlug() {
    this.router.params.subscribe(async (params) => {
      const slug = params['slug'];
      if (slug) {
        this.prepareForCategoryChange();
        this.getCategories(slug);
      }
    });
  }

  private prepareForCategoryChange() {
    this.isLoading.set(true);
    this.news.set([]);
    this.imageLoadingState.set({});
  }

  getCategories(slug: string) {
    firstValueFrom(this.apiService.getCategoryBySlug(slug)).then((category) => {
      if (category) {
        this.category.set(category);
        this.getNewsForCategory(category);
        this.trackCategoryView(slug);
      } else {
        setTimeout(() => this.isLoading.set(false), 800);
      }
    });
  }

  getNewsForCategory(category: Category) {
    if (category) {
      this.apiService.getNewsForCategory(category.id as number).subscribe({
        next: (newNews: News[]) => {
          this.initializeImageLoading(newNews);
          this.news.set(newNews);
          setTimeout(() => this.isLoading.set(false), 300);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  loadMore() {
    // Mantido para compatibilidade
  }

  protected isImageLoading(newsId: number | null | undefined): boolean {
    if (!newsId) return true;
    return this.imageLoadingState()[newsId] ?? true;
  }

  protected handleImageLoaded(newsId: number | null | undefined): void {
    if (!newsId) return;
    this.imageLoadingState.update((state) => ({ ...state, [newsId]: false }));
  }

  protected handleImageError(newsId: number | null | undefined): void {
    if (!newsId) return;
    this.imageLoadingState.update((state) => ({ ...state, [newsId]: false }));
  }

  protected formatDate(date: string): string {
    return new Date(date)
      .toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace('.', '');
  }

  protected getImageUrl(
    news: News,
    size: 'medium' | 'small' = 'medium',
  ): string {
    if (!news.mediaNews || news.mediaNews.length === 0) return '';
    return (
      news.mediaNews[0].imgSize?.[size] ||
      news.mediaNews[0].imgSize?.original ||
      ''
    );
  }

  private initializeImageLoading(newsItems: News[] | undefined): void {
    if (!newsItems || !Array.isArray(newsItems)) return;
    const loadingState = newsItems.reduce<Record<number, boolean>>(
      (state, item) => {
        state[item.id] = true;
        return state;
      },
      {},
    );
    this.imageLoadingState.set(loadingState);
  }

  protected getCategoryColor(): string {
    return this.category()?.color || '#eb3336';
  }

  protected getCategoryStyle(): Record<string, string> {
    const color = this.getCategoryColor();
    return {
      '--category-color': color,
      color: color,
    };
  }

  private trackCategoryView(slug: string): void {
    const sessionId = this.sessionService.getSessionId();
    this.analyticsService
      .trackPageView(`/category/${slug}`, sessionId)
      .subscribe({
        error: (err) => console.error('Analytics tracking failed', err),
      });
  }
}
