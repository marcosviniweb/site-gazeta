import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../../core/services/video.service';
import { CategoryService } from '../../../core/services/category.service';
import { Video, Category } from '@site-gazeta/models';
import { concatMap, debounceTime, distinctUntilChanged, finalize, from, Subject, takeUntil, toArray } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { VideoListFiltersComponent } from './video-list-filters/video-list-filters.component';
import { AlertService } from '@site-gazeta/alert';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [CommonModule, RouterModule, VideoListFiltersComponent, MatIconModule],
  templateUrl: './video-list.component.html',
  styleUrl: './video-list.component.scss',
})
export class VideoListComponent implements OnInit, OnDestroy {
  private videoService = inject(VideoService);
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Estado da Lista
  videos = signal<Video[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  totalItems = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(25);
  lastPage = signal<number>(1);
  totalFeatured = signal<number>(0);

  // Vídeo em Play
  playingVideoId = signal<number | null>(null);

  // Seleção e Processamento em Massa
  selectedIds = signal<Set<number>>(new Set());
  isProcessing = signal<boolean>(false);
  processingProgress = signal<{ current: number; total: number }>({ current: 0, total: 0 });

  // Exclusão simples temporária mantida p/ compatibilidade do botão atual 
  videoToDelete = signal<Video | null>(null);
  showDeleteConfirm = signal(false);

  // Filtros
  filterSearch = signal<string>('');
  filterCategory = signal<number | null>(null);
  filterOrder = signal<'desc' | 'asc'>('desc');
  filterFeatured = signal<boolean | null>(null);
  filterDate = signal<string>('');
  filterViews = signal<'asc' | 'desc' | ''>('');

  // Stream para busca com debounce
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.getCategories();
    this.loadVideos();
    this.loadTotalFeatured();

    // Configura o debounce da busca
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterSearch.set(searchTerm);
      this.currentPage.set(1);
      this.loadVideos();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVideos(): void {
    this.isLoading.set(true);
    
    const params = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.filterSearch() || undefined,
      categoryId: this.filterCategory() || undefined,
      date: this.filterDate() || undefined,
      order: this.filterOrder() || undefined,
      views: this.filterViews() || undefined,
      featured: this.filterFeatured() ?? undefined,
    };

    this.videoService.getAll(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.videos.set(response.data);
          this.totalItems.set(response.meta.total);
          this.lastPage.set(response.meta.lastPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error) => {
          this.alertService.error('Erro', 'Falha ao carregar vídeos.');
          console.error(error);
        }
      });
  }

  getCategories(): void {
    this.categoryService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Erro ao carregar categorias', error)
    });
  }

  loadTotalFeatured(): void {
    this.videoService.getAll({ featured: true, limit: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.totalFeatured.set(response.meta.total),
        error: (error) => console.error('Erro ao carregar total de destaques', error)
      });
  }

  // --- Paginação ---

  nextPage(): void {
    if (this.currentPage() < this.lastPage()) {
      this.currentPage.update(p => p + 1);
      this.loadVideos();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadVideos();
    }
  }

  // --- Seleção e Ações em Massa ---
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const ids = this.videos().map(v => v.id);
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
    return this.videos().length > 0 && this.selectedIds().size === this.videos().length;
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  async bulkToggleFeatured(featured: boolean): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (!confirm(`Deseja ${featured ? 'ativar' : 'remover'} o destaque de ${ids.length} vídeos?`)) return;

    this.startProcessing(ids.length);

    from(ids).pipe(
      concatMap(id => {
        this.incrementProgress();
        // Usando fake-form-data pra fazer update (conforme o backend em `PATCH /videos/:id/upload` com featured: string)
        const formData = new FormData();
        formData.append('featured', String(featured));
        return this.videoService.update(id, formData);
      }),
      toArray(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.finishProcessing(`Destaques atualizados com sucesso.`);
        this.loadVideos();
        this.loadTotalFeatured();
      },
      error: () => this.handleError('Falha ao atualizar destaques.')
    });
  }

  async bulkDelete(): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (!confirm(`PERIGO: Deseja realmente EXCLUIR PERMANENTEMENTE ${ids.length} vídeos?`)) return;

    this.startProcessing(ids.length);

    from(ids).pipe(
      concatMap(id => {
        this.incrementProgress();
        return this.videoService.delete(id);
      }),
      toArray(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.finishProcessing(`${ids.length} vídeos excluídos.`);
        this.loadVideos();
      },
      error: () => this.handleError('Falha ao excluir alguns vídeos.')
    });
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
    this.clearSelection();
    this.alertService.success('Sucesso', message);
  }

  private handleError(message: string): void {
    this.isProcessing.set(false);
    this.alertService.error('Erro Parcial', message);
    this.loadVideos();
  }

  // --- Filtros Setters ---
  setFilterSearch(search: string): void {
    this.searchSubject.next(search);
  }

  setFilterDate(date: string): void {
    this.filterDate.set(date);
    this.currentPage.set(1);
    this.loadVideos();
  }

  setFilterViews(views: 'asc' | 'desc' | ''): void {
    this.filterViews.set(views);
    this.currentPage.set(1);
    this.loadVideos();
  }

  setFilterCategory(categoryId: number | null): void {
    this.filterCategory.set(categoryId);
    this.currentPage.set(1);
    this.loadVideos();
  }

  setFilterOrder(order: 'desc' | 'asc' | null): void {
    if (order) {
      this.filterOrder.set(order);
      this.currentPage.set(1);
      this.loadVideos();
    }
  }

  setFilterFeatured(featured: boolean | null): void {
    this.filterFeatured.set(featured);
    this.currentPage.set(1);
    this.loadVideos();
  }

  // --- Funções Auxiliares Visuais / Lógica Atual ---

  editVideo(video: Video): void {
    this.router.navigate(['/videos', video.id]);
  }

  confirmDelete(video: Video): void {
    this.videoToDelete.set(video);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.videoToDelete.set(null);
    this.showDeleteConfirm.set(false);
  }

  deleteVideo(): void {
    const video = this.videoToDelete();
    if (!video?.id) return;
    this.videoService.delete(video.id).subscribe({
      next: () => {
        this.loadVideos();
        this.cancelDelete();
      },
      error: (err) => {
        console.error('Erro ao deletar vídeo:', err);
        this.cancelDelete();
      }
    });
  }

  togglePlayVideo(videoId: number): void {
    if (this.playingVideoId() === videoId) {
      this.playingVideoId.set(null);
    } else {
      this.playingVideoId.set(videoId);
    }
  }

  isPlaying(videoId: number): boolean {
    return this.playingVideoId() === videoId;
  }

  formatDuration(duration: string | undefined): string {
    if (!duration) return '00:00';
    if (duration.includes(':')) {
      return duration;
    }
    const totalSeconds = parseInt(duration);
    if (isNaN(totalSeconds)) return duration;
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
