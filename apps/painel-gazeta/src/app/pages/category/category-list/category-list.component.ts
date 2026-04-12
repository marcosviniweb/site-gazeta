import { Component, input, output, computed, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '@site-gazeta/models';

@Component({
  selector: 'app-category-list',
  imports: [FormsModule, MatIconModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent {
  categories = input.required<Category[]>();
  
  editCategory = output<Category>();
  deleteCategory = output<Category>();
  toggleStatus = output<Category>();


  searchTerm = signal('');
  orderBy = signal<'newest' | 'oldest'>('newest');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');


  filteredCategories = computed(() => {
    let filtered = this.categories();

    if (this.searchTerm().trim()) {
      const term = this.searchTerm().toLowerCase().trim();
      filtered = filtered.filter(category => 
        this.normalizeText(category.name).includes(term) ||
        this.normalizeText(category.description).includes(term)
      );
    }

    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(category => {
        if (this.statusFilter() === 'active') {
          return category.isActive;
        } else {
          return !category.isActive;
        }
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt as string).getTime();
      const dateB = new Date(b.createdAt as string).getTime();
      
      if (this.orderBy() === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return filtered;
  });

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  onOrderChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.orderBy.set(target.value as 'newest' | 'oldest');
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as 'all' | 'active' | 'inactive');
  }

  onEdit(category: Category) {
    this.editCategory.emit(category);
  }

  onDelete(category: Category) {
    if (confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      this.deleteCategory.emit(category);
    }
  }

  onToggleStatus(category: Category, event: Event) {
    event.stopPropagation();
    this.toggleStatus.emit(category);
  }

  private normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w]|_/g, '')
      .toLowerCase();
  }

}
