import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '@site-gazeta/alert';
import { News, Category } from '@site-gazeta/models';
import { concatMap, from, Subject, takeUntil, toArray, finalize } from 'rxjs';
import { NewsService } from '../../../core/services/news.service';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-media-cleanup',
  imports: [CommonModule, FormsModule],
  templateUrl: './media-cleanup.component.html',
  styleUrl: './media-cleanup.component.scss',
})
export class MediaCleanupComponent implements OnInit, OnDestroy {
  private newsService = inject(NewsService);
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);
  private destroy$ = new Subject<void>();

  // Estado da Lista
  allNews = signal<News[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  
  // Filtros
  searchTerm = signal<string>('');
  filterCategory = signal<number | null>(null);
  filterStatus = signal<string>('all');
  filterEmphasis = signal<'all' | 'only' | 'none'>('all');
  filterImageStatus = signal<'all' | 'with' | 'without'>('all');
  brokenImageIds = signal<Set<number>>(new Set());

  // Seleção
  selectedIds = signal<Set<number>>(new Set());
  isProcessing = signal<boolean>(false);
  processingProgress = signal<{ current: number; total: number }>({ current: 0, total: 0 });

  // Notícias Filtradas
  filteredNews = computed(() => {
    return this.allNews().filter(news => {
      const matchSearch = news.title.toLowerCase().includes(this.searchTerm().toLowerCase());
      const matchCategory = !this.filterCategory() || (news.categoryId && news.categoryId.includes(this.filterCategory() ?? 0));
      const matchStatus = this.filterStatus() === 'all' || news.status === this.filterStatus();
      
      const matchEmphasis = this.filterEmphasis() === 'all' || 
                           (this.filterEmphasis() === 'only' && news.isEmphasis) ||
                           (this.filterEmphasis() === 'none' && !news.isEmphasis);
                           
      const hasMedia = news.mediaNews && news.mediaNews.length > 0;
      const isBroken = this.brokenImageIds().has(news.id);
      const isEffectivelyWithoutImage = !hasMedia || isBroken;

      const matchImages = this.filterImageStatus() === 'all' ||
                          (this.filterImageStatus() === 'with' && hasMedia && !isBroken) ||
                          (this.filterImageStatus() === 'without' && isEffectivelyWithoutImage);

      return matchSearch && matchCategory && matchStatus && matchEmphasis && matchImages;
    });
  });

  selectedCount = computed(() => this.selectedIds().size);

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    // Carrega notícias e categorias em paralelo
    this.categoryService.getAll().pipe(takeUntil(this.destroy$)).subscribe(cats => this.categories.set(cats));
    
    this.newsService.getAll({ includeTrash: true, limit: 1000 })
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => this.allNews.set(response.data),
        error: () => this.alertService.error('Erro', 'Falha ao carregar notícias.')
      });
  }

  // --- Gerenciamento de Seleção ---

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const ids = this.filteredNews().map(n => n.id);
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

  // --- Ações em Massa ---

  async bulkUpdateStatus(status: 'published' | 'draft' | 'trash'): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const actionLabel = status === 'trash' ? 'mover para lixeira' : `alterar para ${status}`;
    if (!confirm(`Deseja realmente ${actionLabel} ${ids.length} notícias?`)) return;

    this.startProcessing(ids.length);

    from(ids).pipe(
      concatMap(id => {
        this.incrementProgress();
        return this.newsService.updateStatus(id, status);
      }),
      toArray(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.finishProcessing(`Status de ${ids.length} notícias atualizado.`);
        this.loadData();
      },
      error: () => this.handleError('Falha ao atualizar algumas notícias.')
    });
  }

  async bulkToggleEmphasis(isEmphasis: boolean): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (!confirm(`Deseja ${isEmphasis ? 'ativar' : 'remover'} o destaque de ${ids.length} notícias?`)) return;

    this.startProcessing(ids.length);

    from(ids).pipe(
      concatMap(id => {
        this.incrementProgress();
        return this.newsService.updateEmphasis(id, isEmphasis);
      }),
      toArray(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.finishProcessing(`Destaque de ${ids.length} notícias atualizado.`);
        this.loadData();
      },
      error: () => this.handleError('Falha ao atualizar destaques. Lembre-se do limite de 6.')
    });
  }

  async bulkChangeCategory(categoryId: number): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const catName = this.categories().find(c => c.id === categoryId)?.name || 'selecionada';
    if (!confirm(`Deseja mover ${ids.length} notícias para a categoria "${catName}"?`)) return;

    this.startProcessing(ids.length);

    from(ids).pipe(
      concatMap(id => {
        this.incrementProgress();
        return this.newsService.update(id, { categoryId: [categoryId] });
      }),
      toArray(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.finishProcessing(`Categoria de ${ids.length} notícias alterada.`);
        this.loadData();
      },
      error: () => this.handleError('Falha ao alterar categorias.')
    });
  }

  async bulkDelete(): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (!confirm(`PERIGO: Deseja realmente EXCLUIR PERMANENTEMENTE ${ids.length} notícias? Esta ação não pode ser desfeita.`)) return;

    this.startProcessing(ids.length);

    from(ids).pipe(
      concatMap(id => {
        this.incrementProgress();
        return this.newsService.delete(id);
      }),
      toArray(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.finishProcessing(`${ids.length} notícias excluídas permanentemente.`);
        this.loadData();
      },
      error: () => this.handleError('Falha ao excluir algumas notícias.')
    });
  }

  // --- Helpers de Processamento ---

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

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
    this.selectedIds.set(new Set());
    this.alertService.success('Sucesso', message);
  }

  private handleError(message: string): void {
    this.isProcessing.set(false);
    this.alertService.error('Erro Parcial', message);
    this.loadData();
  }

  getCategoryName(ids: number[]): string {
    if (!ids || ids.length === 0) return '-';
    return this.categories()
      .filter(c => c.id !== undefined && ids.includes(c.id))
      .map(c => c.name)
      .join(', ');
  }

  getFeaturedImage(news: News): string | null {
    if (!news.mediaNews || news.mediaNews.length === 0) return null;
    
    const emphasisMedia = news.mediaNews.find(m => m.emphasis);
    const media = emphasisMedia || news.mediaNews[0];
    
    const imgSize = Array.isArray(media.imgSize) ? media.imgSize[0] : media.imgSize;
    return imgSize?.small || imgSize?.medium || imgSize?.original || null;
  }

  onImageError(id: number): void {
    const newSet = new Set(this.brokenImageIds());
    newSet.add(id);
    this.brokenImageIds.set(newSet);
  }
}
