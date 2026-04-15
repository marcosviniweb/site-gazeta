import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  output,
} from '@angular/core';
import { NewsService } from '../../../core/services/news.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category, News } from '@site-gazeta/models';
import { CommonModule } from '@angular/common';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  finalize,
  from,
  Subject,
  takeUntil,
  tap,
  toArray,
} from 'rxjs';
import { RouterModule } from '@angular/router';
import { AlertService } from '@site-gazeta/alert';
import { FormsModule } from '@angular/forms';
import { NewsListFiltersComponent } from './news-list-filters/news-list-filters.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-news-list',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NewsListFiltersComponent,
    MatIconModule,
  ],
  templateUrl: './news-list.component.html',
  styleUrl: './news-list.component.scss',
})
export class NewsListComponent implements OnInit, OnDestroy {
  private newsService = inject(NewsService);
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);
  private destroy$ = new Subject<void>();

  // Estado da Lista
  news = signal<News[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  totalItems = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(25);
  lastPage = signal<number>(1);
  totalFeatured = signal<number>(0);

  // Seleção
  selectedIds = signal<Set<number>>(new Set());
  isProcessing = signal<boolean>(false);
  processingProgress = signal<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  // Filtros
  filterSearch = signal<string>('');
  filterCategory = signal<number | null>(null);
  filterStatus = signal<string>('ACTIVE');
  filterOrder = signal<'desc' | 'asc'>('desc');
  filterEmphasis = signal<boolean | null>(null);
  filterDate = signal<string>('');
  filterViews = signal<'asc' | 'desc' | ''>('');

  // Stream para busca com debounce
  private searchSubject = new Subject<string>();

  newsEmitter = output<News>();

  // Modal de exclusão
  itemToDelete = signal<News | null>(null);
  showDeleteConfirm = signal(false);

  ngOnInit(): void {
    this.getCategories();
    this.loadNews();
    this.loadTotalFeatured();

    // Configura o debounce da busca
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterSearch.set(searchTerm);
        this.currentPage.set(1); // Volta para a primeira página ao buscar
        this.loadNews();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNews(): void {
    this.isLoading.set(true);

    const params = {
      page: this.currentPage(),
      limit: this.pageSize(),
      status: this.filterStatus() !== 'all' ? this.filterStatus() : undefined,
      search: this.filterSearch() || undefined,
      categoryId: this.filterCategory() ?? undefined,
      date: this.filterDate() || undefined,
      order: this.filterOrder() || undefined,
      views: this.filterViews() || undefined,
      isEmphasis: this.filterEmphasis() ?? undefined,
      includeTrash:
        this.filterStatus() === 'TRASH' || this.filterStatus() === 'all',
    };

    this.newsService
      .getAll(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.news.set(response?.data || []);
          this.totalItems.set(response?.meta?.total ?? 0);
          this.lastPage.set(response?.meta?.lastPage ?? 1);

          // Scroll suave para o topo ao mudar de página ou filtro
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error) => {
          this.alertService.error('Erro', 'Falha ao carregar notícias.');
          console.error(error);
        },
      });
  }

  getCategories(): void {
    this.categoryService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: (error) => console.error('Erro ao carregar categorias', error),
      });
  }

  loadTotalFeatured(): void {
    this.newsService
      .getAll({ isEmphasis: true, limit: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalFeatured.set(response?.meta?.total ?? 0);
        },
        error: (error) =>
          console.error('Erro ao carregar total de destaques', error),
      });
  }

  // --- Paginação ---

  nextPage(): void {
    if (this.currentPage() < this.lastPage()) {
      this.currentPage.update((p) => p + 1);
      this.loadNews();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadNews();
    }
  }

  // --- Gerenciamento de Seleção ---

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const ids = this.news().map((n) => n.id);
      this.selectedIds.set(new Set(ids));
    } else {
      this.clearSelection();
    }
  }

  toggleSelection(id: number): void {
    const newSet = new Set(this.selectedIds());
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    this.selectedIds.set(newSet);
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  isAllSelected(): boolean {
    const news = this.news();
    if (!news || !Array.isArray(news)) return false;
    return news.length > 0 && this.selectedIds().size === news.length;
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // --- Ações em Massa ---

  async bulkUpdateStatus(
    status: 'ACTIVE' | 'INACTIVE' | 'TRASH',
  ): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const actionLabel =
      status === 'TRASH'
        ? 'mover para lixeira'
        : `alterar para ${status.toLowerCase()}`;
    if (!confirm(`Deseja realmente ${actionLabel} ${ids.length} notícias?`))
      return;

    this.startProcessing(ids.length);

    from(ids)
      .pipe(
        concatMap((id) => {
          this.incrementProgress();
          return this.newsService.update(id, { status });
        }),
        toArray(),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.finishProcessing(`Status de ${ids.length} notícias atualizado.`);
          this.loadNews();
        },
        error: () => this.handleError('Falha ao atualizar algumas notícias.'),
      });
  }

  async bulkToggleEmphasis(isEmphasis: boolean): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (
      !confirm(
        `Deseja ${isEmphasis ? 'ativar' : 'remover'} o destaque de ${ids.length} notícias?`,
      )
    )
      return;

    this.startProcessing(ids.length);

    from(ids)
      .pipe(
        concatMap((id) => {
          this.incrementProgress();
          return this.newsService.updateEmphasis(id, isEmphasis);
        }),
        toArray(),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.finishProcessing(
            `Destaque de ${ids.length} notícias atualizado.`,
          );
          this.loadNews();
          this.loadTotalFeatured();
        },
        error: () =>
          this.handleError(
            'Falha ao atualizar destaques. Lembre-se do limite de 6.',
          ),
      });
  }

  async bulkDelete(): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (
      !confirm(
        `PERIGO: Deseja realmente EXCLUIR PERMANENTEMENTE ${ids.length} notícias? Esta ação não pode ser desfeita.`,
      )
    )
      return;

    this.startProcessing(ids.length);

    from(ids)
      .pipe(
        concatMap((id) => {
          this.incrementProgress();
          return this.newsService.delete(id);
        }),
        toArray(),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.finishProcessing(
            `${ids.length} notícias excluídas permanentemente.`,
          );
          this.loadNews();
        },
        error: () => this.handleError('Falha ao excluir algumas notícias.'),
      });
  }

  // --- Helpers de Processamento ---

  private startProcessing(total: number): void {
    this.isProcessing.set(true);
    this.processingProgress.set({ current: 0, total });
  }

  private incrementProgress(): void {
    const p = this.processingProgress();
    this.processingProgress.set({ ...p, current: p.current + 1 });
  }

  private finishProcessing(message: string): void {
    this.isProcessing.set(false);
    this.clearSelection();
    this.alertService.success('Sucesso', message);
  }

  private handleError(message: string): void {
    this.isProcessing.set(false);
    this.alertService.error('Erro Parcial', message);
    this.loadNews();
  }

  // --- Filtros ---

  setFilterSearch(search: string): void {
    this.searchSubject.next(search);
  }

  setFilterDate(date: string): void {
    this.filterDate.set(date);
    this.currentPage.set(1);
    this.loadNews();
  }

  setFilterViews(views: 'asc' | 'desc' | ''): void {
    this.filterViews.set(views);
    this.currentPage.set(1);
    this.loadNews();
  }

  setFilterStatus(status: string): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
    this.loadNews();
  }

  setFilterCategory(categoryId: number | null): void {
    this.filterCategory.set(categoryId);
    this.currentPage.set(1);
    this.loadNews();
  }

  setFilterOrder(order: 'desc' | 'asc' | null): void {
    if (order) {
      this.filterOrder.set(order);
      this.currentPage.set(1);
      this.loadNews();
    }
  }

  setFilterEmphasis(isEmphasis: boolean | null): void {
    this.filterEmphasis.set(isEmphasis);
    this.currentPage.set(1);
    this.loadNews();
  }

  // --- Outros Métodos ---

  openNewsInSite(slug: string): void {
    const siteUrl =
      window.location.origin.replace(':4201', ':4200') ||
      'http://localhost:4200';
    const newsUrl = `${siteUrl}/news/${slug}`;
    window.open(newsUrl, '_blank');
  }

  editNews(news: News): void {
    this.newsEmitter.emit(news);
  }

  getCategoryNames(categoryId: number[]): string {
    return (
      this.categories()
        .filter((c) => c.id !== undefined && categoryId.includes(c.id))
        .map((c) => c.name)
        .join(', ') || 'Sem Categoria'
    );
  }

  hasNoEmphasisImage(news: News): boolean {
    if (!news.mediaNews || news.mediaNews.length === 0) return true;
    return !news.mediaNews.some((m) => m.emphasis);
  }

  getFeaturedImage(news: News): string | null {
    if (!news.mediaNews || news.mediaNews.length === 0) return null;
    const emphasisMedia = news.mediaNews.find((m) => m.emphasis);
    const media = emphasisMedia || news.mediaNews[0];
    const imgSize = Array.isArray(media.imgSize)
      ? media.imgSize[0]
      : media.imgSize;
    return imgSize?.small || imgSize?.medium || imgSize?.original || null;
  }

  // --- Modal de Exclusão ---
  confirmDelete(news: News): void {
    this.itemToDelete.set(news);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.itemToDelete.set(null);
    this.showDeleteConfirm.set(false);
  }

  deleteItem(): void {
    const news = this.itemToDelete();
    if (!news?.id) return;

    this.newsService.delete(news.id).subscribe({
      next: () => {
        this.loadNews();
        this.cancelDelete();
        this.alertService.success(
          'Sucesso',
          'Notícia excluída permanentemente.',
        );
      },
      error: (err) => {
        console.error('Erro ao excluir notícia:', err);
        this.cancelDelete();
        this.alertService.error('Erro', 'Falha ao excluir notícia.');
      },
    });
  }
}
