import { Component, inject, signal, OnInit, computed } from '@angular/core';

import { Category, HexColor } from '@site-gazeta/models';
import { CategoryFormComponent } from './category-form/category-form.component';
import { CategoryListComponent } from './category-list/category-list.component';
import { CategoryService } from '../../core/services/category.service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '@site-gazeta/alert';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-category',
  imports: [CategoryFormComponent, CategoryListComponent, MatIconModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class CategoryComponent implements OnInit {
  categories = signal<Category[]>([]);
  editingCategory = signal<Category | null>(null);
  categoryService = inject(CategoryService);
  private alertService = inject(AlertService);

  // Modal de exclusão
  categoryToDelete = signal<Category | null>(null);
  showDeleteConfirm = signal(false);

  // Computed property to get all used colors
  usedColors = computed(() => {
    return this.categories()
      .map((category) => category.color as HexColor)
      .filter((color, index, array) => array.indexOf(color) === index); // Remove duplicates
  });
  onCategorySubmit(categoryData: Category) {
    if (this.categories().find((c) => c.id === categoryData.id)) {
      this.categories.update((categories) =>
        categories.map((c) => (c.id === categoryData.id ? categoryData : c)),
      );
      // Resetar edição após atualizar
      this.editingCategory.set(null);
    } else {
      this.categories.update((categories) => [...categories, categoryData]);
    }
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe((categories) => {
      this.categories.set(categories as Category[]);
    });
  }

  onEditCategory(category: Category) {
    this.editingCategory.set(category);
  }

  onDeleteCategory(category: Category) {
    this.categoryToDelete.set(category);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.categoryToDelete.set(null);
    this.showDeleteConfirm.set(false);
  }

  confirmDeleteCategory(): void {
    const category = this.categoryToDelete();
    if (!category) return;

    if (category.isActive === false) {
      firstValueFrom(this.categoryService.delete(category.id as number))
        .then((res) => {
          this.alertService.success(
            'Sucesso',
            'Categoria excluída com sucesso!',
          );
          this.categories.update((categories) =>
            categories.filter((c) => c.id !== category.id),
          );
          this.cancelDelete();
        })
        .catch((err) => {
          this.alertService.error('Erro', 'Falha ao excluir categoria.');
          this.cancelDelete();
          throw err;
        });
    } else {
      this.alertService.warning(
        'Atenção',
        'A categoria não pode ser excluída porque está ativa!',
      );
      this.cancelDelete();
    }
  }

  onCancelEdit() {
    this.editingCategory.set(null);
  }

  onToggleStatus(category: Category) {
    // Usar o endpoint PATCH de atualização, modificando apenas o isActive
    firstValueFrom(
      this.categoryService.update(category.id as number, {
        isActive: !category.isActive,
      }),
    )
      .then((updatedCategory) => {
        this.alertService.success(
          'Sucesso',
          `Categoria ${updatedCategory.isActive ? 'ativada' : 'desativada'} com sucesso!`,
        );

        // Atualizar a categoria na lista local
        this.categories.update((categories) =>
          categories.map((c) => (c.id === category.id ? updatedCategory : c)),
        );
      })
      .catch((err) => {
        this.alertService.error(
          'Erro',
          'Não foi possível alterar o status da categoria. Tente novamente.',
        );
        console.error('Erro ao alterar status da categoria:', err);
      });
  }
}
