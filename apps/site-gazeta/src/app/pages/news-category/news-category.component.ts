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
      this.apiService.getNewsByCategory(category.id as number, { page: 1 }).subscribe({
        next: (response) => {
          this.initializeImageLoading(response.data);
          this.news.set(response.data);
          this.paginationMeta.set(response.meta);
          setTimeout(() => this.isLoading.set(false), 300);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  loadMore() {
    const category = this.category();
    const meta = this.paginationMeta();
    
    if (category && meta && meta.page < meta.lastPage) {
      const nextPage = meta.page + 1;
      this.apiService.getNewsByCategory(category.id as number, { page: nextPage }).subscribe({
        next: (response) => {
          this.initializeImageLoading(response.data);
          // Adiciona as novas notícias às atuais
          this.news.update(current => [...current, ...response.data]);
          this.paginationMeta.set(response.meta);
        },
        error: (err) => console.error('Error loading more news', err)
      });
    }
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
    const media = this.getDisplayMedia(news);
    if (!media) return '';

    const imageSizes = Array.isArray(media.imgSize)
      ? media.imgSize[0]
      : media.imgSize;

    return imageSizes?.[size] || imageSizes?.original || '';
  }

  /**
   * A news item may contain video/legacy media entries before its photo.
   * Prefer the featured photo and otherwise use the first media with a usable
   * image URL instead of assuming that mediaNews[0] is renderable.
   */
  private getDisplayMedia(news: News): any | undefined {
    const media = news.mediaNews ?? [];
    const hasImage = (item: any) => {
      const imageSizes = Array.isArray(item?.imgSize)
        ? item.imgSize[0]
        : item?.imgSize;
      return Boolean(
        imageSizes?.original ||
          imageSizes?.medium ||
          imageSizes?.small ||
          imageSizes?.superSmall,
      );
    };

    return media.find((item: any) => item.emphasis && hasImage(item)) ??
      media.find(hasImage);
  }

  private initializeImageLoading(newsItems: News[] | undefined): void {
    if (!newsItems || !Array.isArray(newsItems)) return;
    this.imageLoadingState.update((currentState) =>
      newsItems.reduce<Record<number, boolean>>(
        (state, item) => {
          if (state[item.id] === undefined) {
            state[item.id] = true;
          }
          return state;
        },
        { ...currentState },
      ),
    );
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
