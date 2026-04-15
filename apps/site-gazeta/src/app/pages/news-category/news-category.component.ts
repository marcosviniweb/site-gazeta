import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ApiService } from '../../core/service/api.service';
import { AnalyticsService } from '../../core/service/analytics.service';
import { SessionService } from '../../core/service/session.service';
import { Category, News } from '@site-gazeta/models';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MoreNewsComponent } from '@site-gazeta/more-news';

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
  protected category = signal<Category | null>(null);
  protected news = signal<News[]>([]);
  private router = inject(ActivatedRoute);

  protected isLoading = signal<boolean>(true);
  protected imageLoadingState = signal<Record<number, boolean>>({});
  protected paginationMeta = signal<any>(null);
  protected currentPage = signal<number>(1);

  private emphasisNews = computed(() => {
    return this.news()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 3);
  });

  protected featuredNews = computed(() => {
    const emphasisList = this.emphasisNews();
    return emphasisList.length > 0 ? emphasisList[0] : null;
  });

  protected secondaryNews = computed(() => {
    return this.emphasisNews().slice(1, 3);
  });

  protected moreNews = computed(() => {
    const emphasisIds = this.emphasisNews().map((news) => news.id);
    return this.news()
      .filter((news) => !emphasisIds.includes(news.id))
      .sort(
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
    this.currentPage.set(1);
    this.paginationMeta.set(null);
  }

  getCategories(slug: string) {
    firstValueFrom(this.apiService.getCategoryBySlug(slug)).then((category) => {
      if (category) {
        this.category.set(category);
        this.getNewsForCategory(category);
        this.trackCategoryView(slug);
      } else {
        setTimeout(() => {
          this.isLoading.set(false);
        }, 1000);
      }
    });
  }

  getNewsForCategory(category: Category) {
    if (category) {
      this.apiService
        .getNewsForCategory(category.id as number)
        .subscribe((newNews: News[]) => {
          this.initializeImageLoading(newNews);
          this.news.set(newNews);
          this.paginationMeta.set(null);
          this.currentPage.set(1);

          setTimeout(() => {
            this.isLoading.set(false);
          }, 300);
        });
    }
  }

  loadMore() {
    // Este método não é mais necessário pois não há paginação
    // Mantido para compatibilidade se for usado no template
  }

  protected isImageLoading(newsId: number | null | undefined): boolean {
    if (!newsId) {
      return true;
    }
    return this.imageLoadingState()[newsId] ?? true;
  }

  protected handleImageLoaded(newsId: number | null | undefined): void {
    if (!newsId) {
      return;
    }
    this.imageLoadingState.update((state) => ({
      ...state,
      [newsId]: false,
    }));
  }

  protected handleImageError(newsId: number | null | undefined): void {
    if (!newsId) {
      return;
    }
    this.imageLoadingState.update((state) => ({
      ...state,
      [newsId]: false,
    }));
  }

  private initializeImageLoading(newsItems: News[] | undefined): void {
    if (!newsItems || !Array.isArray(newsItems)) {
      return;
    }
    const loadingState = newsItems.reduce<Record<number, boolean>>(
      (state, item) => {
        state[item.id] = true;
        return state;
      },
      {},
    );
    this.imageLoadingState.set(loadingState);
  }

  private trackCategoryView(slug: string): void {
    const sessionId = this.sessionService.getSessionId();
    this.analyticsService
      .trackPageView(`/category/${slug}`, sessionId)
      .subscribe({
        next: () => {
          /* View tracked successfully */
        },
        error: (err) => {
          console.error('Analytics tracking failed', err);
        },
      });
  }
}
