import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/service/api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { News } from '@site-gazeta/models';
import { MoreNewsComponent } from '@site-gazeta/more-news';
import { NewsManagerService } from '../../core/service/news-manager.service';

@Component({
  selector: 'app-news-search',
  imports: [CommonModule, MoreNewsComponent],
  templateUrl: './news-search.component.html',
  styleUrl: './news-search.component.scss',
})
export class NewsSearchComponent implements OnDestroy {
  private apiService = inject(ApiService);
  private newsManagerService = inject(NewsManagerService);
  private destroyRef = inject(DestroyRef);

  query = input<string>('');
  filteredNews = signal<News[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Computed que sempre retorna uma string válida para o template
  safeQuery = computed(() => this.query() ?? '');
  queryLength = computed(() => this.query().length >= 2);

  constructor() {
    // Effect que reage a mudanças na query com cleanup adequado
    // biome-ignore lint/complexity/noExplicitAny: API response typing
    effect(
      () => {
        const query = this.query() ?? '';

        // Cleanup: cancelar timeout anterior
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
          this.searchTimeout = null;
        }

        // Debounce da busca
        this.searchTimeout = setTimeout(() => {
          this.getNewsByQuery(query);
        }, 300);
      },
      { allowSignalWrites: true },
    );
  }

  private getNewsByQuery(query: string): void {
    // Limpa lista atual e erro
    this.filteredNews.set([]);
    this.error.set(null);

    // Valida se query é válido (mínimo 2 caracteres)
    if (query.length < 2) {
      this.filteredNews.set([]);
      return;
    }

    this.isLoading.set(true);

    this.apiService
      .getBySearch(query, 20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.filteredNews.set(response.data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Erro ao buscar notícias. Tente novamente.');
          this.isLoading.set(false);
          console.error('Search error:', err);
        },
      });
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    // Limpa lista ao destruir o componente
    this.filteredNews.set([]);
    this.newsManagerService.clearExcludedIds();
  }
}
