import { Component, signal, computed, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { Ads, News, NewsMedia } from '@site-gazeta/models';
import { ApiService } from '../../core/service/api.service';
import { AnalyticsService } from '../../core/service/analytics.service';
import { SessionService } from '../../core/service/session.service';
import { RouterModule } from '@angular/router';
import { RelatedNewsComponent } from '@site-gazeta/related-news';
import { MoreNewsComponent } from '@site-gazeta/more-news';
import { GalleryComponent } from '@site-gazeta/gallery';
import { ModalComponent } from '@site-gazeta/modal';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdsComponent } from '@site-gazeta/ads';
import { MetaTagsService } from '../../core/service/meta-tags.service';
import { VideoPlayerComponent } from '@site-gazeta/video-player';
import { parseContentBlocks, ContentBlock } from '../../shared/pipes/content-blocks.pipe';
@Component({
  selector: 'app-news-content',
  imports: [
    CommonModule,
    RouterModule,
    RelatedNewsComponent,
    MoreNewsComponent,
    GalleryComponent,
    ModalComponent,
    AdsComponent,
    VideoPlayerComponent
  ],
  templateUrl: './news-content.component.html',
  styleUrl: './news-content.component.scss',
  standalone: true
})
export class NewsContentComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  apiService = inject(ApiService);
  analyticsService = inject(AnalyticsService);
  sessionService = inject(SessionService);
  news = signal<News | null>(null);
  error = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  relatedNews = signal<News[]>([]);
  moreNews = signal<News[]>([]);
  protected heroImageLoading = signal<boolean>(true);
  protected galleryModalOpen = signal<boolean>(false);
  protected selectedGalleryMedia = signal<NewsMedia | null>(null);
  protected galleryImageLoading = signal<boolean>(true);

  // Analytics tracking
  private sessionId: string = this.sessionService.getSessionId();
  private viewStartTime: number = Date.now();
  private hasTrackedInitialView = false;
  private metaService = inject(MetaTagsService);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);

  /** HTML rico da matéria (imagens, vídeos embutidos); bypass para não remover &lt;video&gt;. */
  safeNewsContent = computed<SafeHtml>(() => {
    const html = this.news()?.content ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  /** Conteúdo dividido em blocos: texto (html) e vídeos inline (video). */
  contentBlocks = computed<ContentBlock[]>(() => {
    const html = this.news()?.content ?? '';
    return parseContentBlocks(html, this.sanitizer, isPlatformBrowser(this.platformId));
  });

  getSafeVideoUrl(url: string): SafeResourceUrl {
    const embedUrl = url
      .replace('https://www.youtube.com/watch?v=', 'https://www.youtube.com/embed/')
      .replace('https://youtu.be/', 'https://www.youtube.com/embed/')
      .replace('http://www.youtube.com/watch?v=', 'https://www.youtube.com/embed/')
      .replace('http://youtu.be/', 'https://www.youtube.com/embed/');
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  emphasisMedia = computed(() => {
    const currentNews = this.news();
    if (!currentNews) return null;
    return this.pickHeroMedia(currentNews) ?? null;
  });

  // Computed signal para outras mídias
  otherMedias = computed(() => {
    const currentNews = this.news();
    if (!currentNews) return [];
    return currentNews.mediaNews.filter((media: NewsMedia) => !media.emphasis && this.hasMediaSource(media));
  });

  protected galleryImageSource = computed(() => {
    const media = this.selectedGalleryMedia();
    if (!media) return '';

    return media.imgSize?.original || media.imgSize?.medium || media.imgSize?.small || '';
  });

  protected galleryImageCaption = computed(() => {
    const media = this.selectedGalleryMedia();
    if (!media) return '';

    return media.author?.trim() || 'Imagem da galeria';
  });

  // Computed signal para formatar visualizações
  formattedViews = computed(() => {
    const currentNews = this.news();
    if (!currentNews?.views) return '0 visualizações';

    const views = currentNews.views;
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M visualizações';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K visualizações';
    }

    return views.toString() + ' visualizações';
  });

  protected handleHeroImageLoaded(): void {
    this.heroImageLoading.set(false);
  }

  protected handleHeroImageError(): void {
    this.heroImageLoading.set(false);
  }

  protected handleGalleryImageLoaded(): void {
    this.galleryImageLoading.set(false);
  }

  protected handleGalleryImageError(): void {
    this.galleryImageLoading.set(false);
  }

  protected openGalleryMedia(media: NewsMedia): void {
    this.selectedGalleryMedia.set(media);
    this.galleryImageLoading.set(true);
    this.galleryModalOpen.set(true);
  }

  protected closeGalleryMedia(): void {
    this.galleryModalOpen.set(false);
    this.selectedGalleryMedia.set(null);
    this.galleryImageLoading.set(true);
  }

  protected centerAd = toSignal(this.apiService.getAdsByPlacementAndPosition('content', 'center'), {
    initialValue: {} as Record<string, Ads>,
  });
  protected bottomAd = toSignal(this.apiService.getAdsByPlacementAndPosition('content', 'bottom'), {
    initialValue: {} as Record<string, Ads>,
  });
  
  canShare = signal<boolean>(false);

  ngOnInit(): void {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      this.canShare.set(true);
    }

    // Preparado para receber o slug da rota
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.prepareForNewsChange();
        this.fetchNewsBySlug(slug);
        this.getMoreNews();
      }
    });



  }

  private prepareForNewsChange() {
    this.isLoading.set(true);
    this.heroImageLoading.set(true);
    this.news.set(null);
    this.error.set(null);
  }
  private updateMetaTags(news: News) {
    this.metaService.updateTitle(news.title);
    this.metaService.updateTags([
      { name: 'description', content: news.subtitle },
      { property: 'og:title', content: news.title },
      { property: 'og:description', content: news.subtitle },
      { property: 'og:image', content: news.mediaNews[0].imgSize?.original },
      { property: 'og:url', content: `https://gazetadopara.com/news/${news.slug}` },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'Gazeta do Pará' },
      { property: 'og:locale', content: 'pt-BR' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: `https://gazetadopara.com/news/${news.slug}` },
      { property: 'og:image:alt', content: news.title },
    ]);
  }
  private fetchNewsBySlug(slug: string) {
    this.apiService.getNewsBySlug(slug)
      .subscribe({
        next: (news: News | undefined) => {
          if (news) {
            this.news.set(news);
            this.updateMetaTags(news);
            if (!this.hasHeroMedia(news)) {
              this.heroImageLoading.set(false);
            }
           
            this.trackInitialView(news);
            this.getRelatedNews();
            this.goToTop();
          }
        },
        error: (err) => {
          console.error('Error fetching news:', err);
          this.error.set("Notícia não encontrada");
          this.heroImageLoading.set(false);
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
  }
  goToTop() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  getRelatedNews() {
    // Agora só precisa passar o newsId, o backend busca as categorias
    this.apiService.getRelatedNews([], this.news()?.id as number)
      .subscribe((news: News[]) => {
        this.relatedNews.set(news);
      });
  }

  getMoreNews() {
    this.apiService.getNews()
      .subscribe((response) => {
        const moreNews = response.data
        .filter((news) => {return !this.relatedNews().includes(news) && news.id !== this.news()?.id})
        .sort(() => Math.random() - 0.5); // Embaralha a ordem aleatoriamente
        this.moreNews.set(moreNews);
      });
  }


  private trackInitialView(news: News): void {
    if (this.hasTrackedInitialView) return;

    this.analyticsService.trackNewsView(
      news.id,
      news.slug,
      this.sessionId
    ).subscribe({
      next: (response: any) => {
        this.hasTrackedInitialView = true;

        // Atualizar o número de visualizações em tempo real se retornado pelo backend
        if (response?.views !== undefined && this.news()) {
          const currentNews = this.news()!;
          this.news.set({
            ...currentNews,
            views: response.views
          });
        }
      },
      error: () => {}
    });
  }

  shareNews(platform: string) {
    const news = this.news();
    if (!news) return;

    const url = `https://gazetadopara.com/news/${news.slug}`;
    const title = encodeURIComponent(news.title);
    const description = encodeURIComponent(news.subtitle);
    const image = encodeURIComponent(news.mediaNews[0].imgSize!.original);

    switch (platform) {
      case 'native':
        if ('share' in navigator) {
          navigator.share({
            title: news.title,
            text: news.subtitle,
            url: `https://gazetadopara.com/news/${news.slug}`
          }).catch(() => {});
        }
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${url}&text=${title}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description}&source=Gazeta do Pará`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${title}&body=${description}%20${url}`;
        break;
      case 'instagram':
        window.open(`https://www.instagram.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'tiktok':
        window.open(`https://www.tiktok.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
    }
  }


  ngOnDestroy(): void {
    const currentNews = this.news();
    if (!currentNews || !this.hasTrackedInitialView) return;

    const duration = Math.floor((Date.now() - this.viewStartTime) / 1000);

    // Registrar duração apenas se o usuário ficou pelo menos 5 segundos
    if (duration >= 5) {
      this.analyticsService.trackViewDuration(
        currentNews.id,
        `/news/${currentNews.slug}`,
        this.sessionId,
        duration
      ).subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }

  private hasHeroMedia(news: News): boolean {
    const heroMedia = this.pickHeroMedia(news);
    if (!heroMedia) {
      return false;
    }
    const source = heroMedia.imgSize?.original || heroMedia.imgSize?.medium || heroMedia.imgSize?.small;
    return !!source;
  }

  private pickHeroMedia(news: News): NewsMedia | undefined {
    if (!news?.mediaNews?.length) {
      return undefined;
    }
    return news.mediaNews.find((media) => media.emphasis) ?? news.mediaNews[0];
  }

  private hasMediaSource(media: NewsMedia): boolean {
    return !!(media.imgSize?.original || media.imgSize?.medium || media.imgSize?.small);
  }

}
