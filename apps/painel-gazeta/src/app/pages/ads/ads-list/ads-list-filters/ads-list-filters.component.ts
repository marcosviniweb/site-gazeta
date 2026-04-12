import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ads-list-filters',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './ads-list-filters.component.html',
  styleUrl: './ads-list-filters.component.scss',
})
export class AdsListFiltersComponent {
  // Inputs - valores atuais dos filtros
  filterDate = input<string>('');
  filterOrder = input<'desc' | 'asc' | null>(null);
  filterPosition = input<string>('');
  filterPlacement = input<string>('');
  filterStatus = input<boolean | null>(null);
  filterSearch = input<string>('');

  // Outputs - eventos de mudança
  filterDateChange = output<string>();
  filterOrderChange = output<'desc' | 'asc' | null>();
  filterPositionChange = output<string>();
  filterPlacementChange = output<string>();
  filterStatusChange = output<boolean | null>();
  filterSearchChange = output<string>();

  // Opções para filtros
  readonly positions = [
    { value: '', label: 'Todas as posições' },
    { value: 'top', label: 'Topo' },
    { value: 'bottom', label: 'Rodapé' },
    { value: 'sidebar', label: 'Barra Lateral' },
    { value: 'header', label: 'Cabeçalho' },
    { value: 'footer', label: 'Rodapé da Página' },
    { value: 'content', label: 'Conteúdo' }
  ];

  readonly placements = [
    { value: '', label: 'Todas as páginas' },
    { value: 'home', label: 'Home' },
    { value: 'content', label: 'Conteúdo' },
    { value: 'header', label: 'Cabeçalho' }
  ];

  readonly statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'true', label: 'Ativo' },
    { value: 'false', label: 'Inativo' }
  ];

  onDateChange(value: string): void {
    this.filterDateChange.emit(value);
  }

  onOrderChange(value: string): void {
    this.filterOrderChange.emit(value === '' ? null : value as 'desc' | 'asc');
  }

  onPositionChange(value: string): void {
    this.filterPositionChange.emit(value);
  }

  onPlacementChange(value: string): void {
    this.filterPlacementChange.emit(value);
  }

  onStatusChange(value: string): void {
    this.filterStatusChange.emit(value === '' ? null : value === 'true');
  }

  onSearchChange(value: string): void {
    this.filterSearchChange.emit(value);
  }
}

