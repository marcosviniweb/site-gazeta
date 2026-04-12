import { Component, input, output, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '@site-gazeta/models';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-video-list-filters',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './video-list-filters.component.html',
  styleUrl: './video-list-filters.component.scss',
})
export class VideoListFiltersComponent implements OnInit {
  private categoryService = inject(CategoryService);

  // Inputs - valores atuais dos filtros
  filterDate = input<string>('');
  filterOrder = input<'desc' | 'asc' | null>(null);
  filterViews = input<'asc' | 'desc' | ''>('');
  filterCategory = input<number | null>(null);
  filterSearch = input<string>('');
  filterFeatured = input<boolean | null>(null);

  // Outputs - eventos de mudança
  filterDateChange = output<string>();
  filterOrderChange = output<'desc' | 'asc' | null>();
  filterViewsChange = output<'asc' | 'desc' | ''>();
  filterCategoryChange = output<number | null>();
  filterSearchChange = output<string>();
  filterFeaturedChange = output<boolean | null>();

  // Signals
  categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    firstValueFrom(this.categoryService.getAll())
      .then((categories) => {
        this.categories.set(categories);
      })
      .catch((error) => {
        console.error('Erro ao carregar categorias:', error);
      });
  }

  onDateChange(value: string): void {
    this.filterDateChange.emit(value);
  }

  onOrderChange(value: string): void {
    this.filterOrderChange.emit(value === '' ? null : value as 'desc' | 'asc');
  }

  onViewsChange(value: string): void {
    this.filterViewsChange.emit(value as 'asc' | 'desc' | '');
  }

  onCategoryChange(value: string): void {
    this.filterCategoryChange.emit(value ? Number(value) : null);
  }

  onSearchChange(value: string): void {
    this.filterSearchChange.emit(value);
  }

  onFeaturedChange(value: string): void {
    this.filterFeaturedChange.emit(value === '' ? null : value === 'true');
  }
}

