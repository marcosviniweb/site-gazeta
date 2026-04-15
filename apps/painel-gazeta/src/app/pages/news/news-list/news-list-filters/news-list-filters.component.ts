import { Component, input, output, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '@site-gazeta/models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-news-list-filters',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './news-list-filters.component.html',
  styleUrl: './news-list-filters.component.scss',
})
export class NewsListFiltersComponent implements OnInit {
  private categoryService = inject(CategoryService);

  // Inputs - valores atuais dos filtros
  filterDate = input<string>('');
  filterOrder = input<'desc' | 'asc' | null>(null);
  filterViews = input<'asc' | 'desc' | ''>('');
  filterCategory = input<number | null>(null);
  filterSearch = input<string>('');
  filterEmphasis = input<boolean | null>(null);
  filterMonth = input<number | null>(null);
  filterYear = input<number | null>(null);

  // Outputs - eventos de mudança
  filterDateChange = output<string>();
  filterOrderChange = output<'desc' | 'asc' | null>();
  filterViewsChange = output<'asc' | 'desc' | ''>();
  filterCategoryChange = output<number | null>();
  filterSearchChange = output<string>();
  filterEmphasisChange = output<boolean | null>();
  filterMonthChange = output<number | null>();
  filterYearChange = output<number | null>();

  // Signals
  categories = signal<Category[]>([]);
  months = signal<{ value: number, label: string }[]>([
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]);
  years = signal<number[]>([]);

  ngOnInit(): void {
    this.loadCategories();
    this.generateYears();
  }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    const startYear = 2023;
    const yearsList = [];
    for (let i = currentYear; i >= startYear; i--) {
      yearsList.push(i);
    }
    this.years.set(yearsList);
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

  onMonthChange(value: string): void {
    this.filterMonthChange.emit(value ? Number(value) : null);
  }

  onYearChange(value: string): void {
    this.filterYearChange.emit(value ? Number(value) : null);
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

  onEmphasisChange(value: string): void {
    this.filterEmphasisChange.emit(value === '' ? null : value === 'true');
  }
}

