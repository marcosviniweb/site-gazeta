import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdsService } from '../../../core/services/ads.service';
import { concatMap, debounceTime, distinctUntilChanged, finalize, from, Subject, takeUntil, toArray } from 'rxjs';
import { Ads } from '@site-gazeta/models';
import { AlertService } from '@site-gazeta/alert';
import { Router, RouterModule } from '@angular/router';
import { AdsListFiltersComponent } from './ads-list-filters/ads-list-filters.component';

@Component({
  selector: 'app-ads-list',
  standalone: true,
  imports: [CommonModule, RouterModule, AdsListFiltersComponent],
  templateUrl: './ads-list.component.html',
  styleUrls: ['./ads-list.component.scss']
})
export class AdsListComponent implements OnInit, OnDestroy {
  private adsService = inject(AdsService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Estado Paginado Padrão
  advertisements = signal<Ads[]>([]);
  isLoading = signal<boolean>(false);
  totalItems = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(25);
  lastPage = signal<number>(1);

  // Modal (para manter lógica do layout sem quebrar a UI original)
  adToDelete = signal<Ads | null>(null);
  showDeleteConfirm = signal(false);

  // Seleção e Bulk Actions
  selectedIds = signal<Set<number>>(new Set());
  isProcessing = signal<boolean>(false);
  processingProgress = signal<{ current: number; total: number }>({ current: 0, total: 0 });

  // Filtros
  filterSearch = signal<string>('');
  filterPosition = signal<string>('');
  filterPlacement = signal<string>('');
  filterStatus = signal<boolean | null>(null);
  filterDate = signal<string>('');
  filterOrder = signal<'desc' | 'asc' | null>(null);

  // Stream para busca
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadAdvertisements();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterSearch.set(searchTerm);
      this.currentPage.set(1);
      this.loadAdvertisements();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAdvertisements(): void {
    this.isLoading.set(true);
    
    // Converte os boolean do filter para chamada Backend
    const isActiveParam = this.filterStatus() !== null ? this.filterStatus() : undefined;

    const params = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.filterSearch() || undefined,
      position: this.filterPosition() || undefined,
      placement: this.filterPlacement() || undefined,
      active: isActiveParam,
      date: this.filterDate() || undefined,
      order: this.filterOrder() || undefined,
    };

    this.adsService.getAll(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.advertisements.set(response.data);
          this.totalItems.set(response.meta.total);
          this.lastPage.set(response.meta.lastPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Erro ao carregar anúncios';
          this.alertService.error('Erro ao carregar', errorMessage);
        }
      });
  }

  // --- Paginação ---

  nextPage(): void {
    if (this.currentPage() < this.lastPage()) {
      this.currentPage.update(p => p + 1);
      this.loadAdvertisements();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadAdvertisements();
    }
  }

  // --- Setters de Filtro ---

  setFilterDate(date: string): void {
    this.filterDate.set(date);
    this.currentPage.set(1);
    this.loadAdvertisements();
  }

  setFilterOrder(order: 'desc' | 'asc' | null): void {
    if (order) {
      this.filterOrder.set(order);
      this.currentPage.set(1);
      this.loadAdvertisements();
    }
  }

  setFilterPosition(position: string): void {
    this.filterPosition.set(position);
    this.currentPage.set(1);
    this.loadAdvertisements();
  }

  setFilterPlacement(placement: string): void {
    this.filterPlacement.set(placement);
    this.currentPage.set(1);
    this.loadAdvertisements();
  }

  setFilterStatus(status: boolean | null): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
    this.loadAdvertisements();
  }

  setFilterSearch(search: string): void {
    this.searchSubject.next(search);
  }

  // --- List Utils ---

  editAdvertisement(ad: Ads): void {
    this.router.navigate(['/ads', ad.id]);
  }

  toggleStatus(ad: Ads): void {
    if(!ad.id) return;
    this.isLoading.set(true);
    this.adsService.toggleActive(ad.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.loadAdvertisements();
          this.alertService.success('Status atualizado!', 'O status do anúncio foi atualizado');
        },
        error: () => this.alertService.error('Erro', 'Ocorreu um erro ao atualizar status.')
      });
  }

  confirmDelete(ad: Ads): void {
    this.adToDelete.set(ad);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.adToDelete.set(null);
    this.showDeleteConfirm.set(false);
  }

  deleteAdvertisement(): void {
    const ad = this.adToDelete();
    if (!ad?.id) return;

    this.isLoading.set(true);
    this.adsService.delete(ad.id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.loadAdvertisements();
          this.alertService.success('Excluído', 'O anúncio foi excluído com sucesso');
          this.cancelDelete();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Erro ao excluir anúncio';
          this.alertService.error('Erro', errorMessage);
          this.cancelDelete();
        }
      });
  }

  getPlacementName(placement: string): string {
    const placements: Record<string, string> = {
      'home': 'Página Inicial',
      'news': 'Página de Notícia',
    };
    return placements[placement] || placement;
  }

  getPositionName(position: string): string {
    const positions: Record<string, string> = {
      'top': 'Topo Principal',
      'bottom': 'Fim da Página',
      'sidebar': 'Barra Lateral',
      'header': 'Cabeçalho',
      'footer': 'Rodapé',
      'content': 'No Meio do Conteúdo',
      'lateral': 'Lateral Flutuante'
    };
    return positions[position] || position;
  }

  // --- Ações em Massa ---

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const ids = this.advertisements()
        .map(a => a.id)
        .filter((id): id is number => id !== undefined);
      this.selectedIds.set(new Set(ids));
    } else {
      this.clearSelection();
    }
  }

  toggleSelection(id: number | undefined): void {
    if (!id) return;
    const newSet = new Set(this.selectedIds());
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    this.selectedIds.set(newSet);
  }

  isSelected(id: number | undefined): boolean {
    if (!id) return false;
    return this.selectedIds().has(id);
  }

  isAllSelected(): boolean {
    return this.advertisements().length > 0 && this.selectedIds().size === this.advertisements().length;
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  async bulkToggleStatus(): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (!confirm(`Deseja alternar o status (Ativo/Inativo) de ${ids.length} anúncios?`)) return;

    this.startProcessing(ids.length);

    from(ids).pipe(
      concatMap(id => {
        this.incrementProgress();
        return this.adsService.toggleActive(id);
      }),
      toArray(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.finishProcessing(`Status de ${ids.length} anúncios atualizado.`);
        this.loadAdvertisements();
      },
      error: () => this.handleError('Falha ao atualizar alguns anúncios.')
    });
  }

  async bulkDelete(): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (!confirm(`PERIGO: Deseja realmente EXCLUIR PERMANENTEMENTE ${ids.length} anúncios?`)) return;

    this.startProcessing(ids.length);

    from(ids).pipe(
      concatMap(id => {
        this.incrementProgress();
        return this.adsService.delete(id);
      }),
      toArray(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.finishProcessing(`${ids.length} anúncios excluídos.`);
        this.loadAdvertisements();
      },
      error: () => this.handleError('Falha ao excluir anúncios.')
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
    this.alertService.success('Concluído', message);
  }

  private handleError(message: string): void {
    this.isProcessing.set(false);
    this.alertService.error('Aviso', message);
    this.loadAdvertisements();
  }
}
