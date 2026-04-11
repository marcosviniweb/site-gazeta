import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/service/api.service';
import { map } from 'rxjs';
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
  query = input<string>('');
  filteredNews = signal<News[]>([]);
  isLoading = signal<boolean>(false);
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Computed que sempre retorna uma string válida para o template
  safeQuery = computed(() => this.query() ?? '');
  queryLength = computed(()=> this.query().length > 1?true :false)
  constructor() {
    effect(() => {
      const query = this.query() ?? '';
      this.getNewsByQuery(query);
    });
  }

  getNewsByQuery(query: string): void {
    // Limpa lista atual
    this.filteredNews.set([]);


    // Limpa timeout anterior se existir
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    // Valida se query é válido
    if(query.length >= 1){
      this.isLoading.set(true)
      this.searchTimeout = setTimeout(() => {
      this.apiService.getBySearch(query, 20).pipe()
      .subscribe((response) => {
        this.filteredNews.set(response.data);
        this.isLoading.set(false);
        this.searchTimeout = null;
      });
      }, 3000);
    }
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
