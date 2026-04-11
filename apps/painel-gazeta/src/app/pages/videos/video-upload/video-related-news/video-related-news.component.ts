import { Component, inject, signal, effect, input, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsService } from '../../../../core/services/news.service';
import { News } from '@site-gazeta/models';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-video-related-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-related-news.component.html',
  styleUrl: './video-related-news.component.scss',
})
export class VideoRelatedNewsComponent implements OnDestroy {
  private newsService = inject(NewsService);
  private searchSubject = new Subject<string>();

  // Inputs
  selectedNewsSlug = input<string | null>(null);

  // Outputs
  newsSlugSelected = output<string | null>();

  // Signals
  searchTerm = signal<string>('');
  searchResults = signal<News[]>([]);
  selectedNews = signal<News | null>(null);
  isSearching = signal<boolean>(false);
  dropdownOpen = signal<boolean>(false);

  constructor() {
    // Effect para carregar notícia inicial quando slug é passado
    effect(() => {
      const slug = this.selectedNewsSlug();
      if (slug) {
        // Buscar notícia pelo slug usando o search
        this.searchTerm.set(slug);
        this.searchSubject.next(slug);
      } else {
        this.selectedNews.set(null);
      }
    });

    // Configurar debounce para busca
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((searchTerm: string) => {
        if (searchTerm.trim().length >= 2) {
          this.isSearching.set(true);
          return this.newsService.search(searchTerm.trim(), { limit: 20 }).pipe(
            catchError((err) => {
              console.error('Erro ao buscar notícias:', err);
              this.isSearching.set(false);
              return of({ data: [], meta: { total: 0, page: 1, limit: 20, lastPage: 1 } });
            })
          );
        }
        this.isSearching.set(false);
        return of({ data: [], meta: { total: 0, page: 1, limit: 20, lastPage: 1 } });
      })
    ).subscribe({
      next: (response) => {
        const newsItems = response.data || [];
        this.searchResults.set(newsItems);
        this.isSearching.set(false);
        
        // Se temos um slug selecionado e encontramos a notícia, selecioná-la automaticamente
        const slug = this.selectedNewsSlug();
        if (slug && !this.selectedNews()) {
          const found = newsItems.find(n => n.slug === slug);
          if (found) {
            this.selectedNews.set(found);
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(open => !open);
    if (!this.dropdownOpen()) {
      this.searchTerm.set('');
      this.searchResults.set([]);
    }
  }

  showSearchInput(): void {
    this.dropdownOpen.set(true);
  }

  hideSearchInput(): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.dropdownOpen.set(false);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchTerm.set(value);

    if (value.length < 2) {
      this.searchResults.set([]);
      this.isSearching.set(false);
      return;
    }

    // Disparar busca através do subject (com debounce)
    this.searchSubject.next(value);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.hideSearchInput();
    }
  }

  onSearchBlur(): void {
    // Delay para permitir clique em itens da lista
    setTimeout(() => {
      this.hideSearchInput();
    }, 200);
  }

  selectNews(news: News): void {
    this.selectedNews.set(news);
    this.newsSlugSelected.emit(news.slug);
    this.hideSearchInput();
  }

  removeNews(): void {
    this.selectedNews.set(null);
    this.newsSlugSelected.emit(null);
  }
}
