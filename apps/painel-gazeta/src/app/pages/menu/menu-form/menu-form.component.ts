import {
  Component,
  effect,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Menu } from '@site-gazeta/models';
import { MultiSelectComponent } from '@site-gazeta/multi-select';
import { MatIconModule } from '@angular/material/icon';
import { SelectModule } from 'primeng/select';
import { MenuFormBase, MenuType } from '../menu-form.base';

@Component({
  selector: 'app-menu-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MultiSelectComponent,
    MatIconModule,
    SelectModule,
  ],
  templateUrl: './menu-form.component.html',
  styleUrl: './menu-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuFormComponent extends MenuFormBase {
  // Inputs & Outputs
  menuToEdit = input<Menu | null>(null);
  existingMenus = input<Menu[]>([]);
  saveEvent = output<Menu>();
  cancelEvent = output<void>();

  showCategoryDropdown = signal(false);

  constructor() {
    super();
    this.initBaseForm();
    this.loadCategories();

    // Effect para atualizar form quando receber menu para editar
    effect(() => {
      const menu = this.menuToEdit();
      if (menu) {
        this.loadMenuForEdit(menu);
      } else {
        // Se não está editando, calcular próxima ordem disponível
        const nextOrder = this.calculateNextOrder();
        this.menuForm.patchValue({ order: nextOrder }, { emitEvent: false });
      }
    });
  }

  private calculateNextOrder(): number {
    const menus = this.existingMenus();
    if (!menus || menus.length === 0) {
      return 1;
    }
    const maxOrder = Math.max(...menus.map((m) => m.order || 1));
    return maxOrder + 1;
  }

  private loadMenuForEdit(menu: Menu): void {
    this.selectedType.set((menu.type as MenuType) || 'internal');
    this.menuForm.patchValue({
      name: menu.name,
      type: menu.type || 'internal',
      routerLink: menu.routerLink || '',
      externalLink: menu.externalLink || '',
      slug: menu.slug || '',
      order: menu.order || 1,
    });
  }

  submitForm(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const formValue = this.menuForm.value;
    const isCategory = formValue.type === 'category';

    if (isCategory && this.selectedCategories().length > 0) {
      this.isLoading.set(true);
      this.createMultipleCategoryMenus();
      return;
    }

    if (isCategory && this.selectedCategories().length === 0) {
      this.alertService.warning(
        'Atenção',
        'Por favor, selecione pelo menos uma categoria',
      );
      return;
    }

    if (this.menuForm.invalid) {
      Object.keys(this.menuForm.controls).forEach((key) => {
        const control = this.menuForm.get(key);
        if (control?.invalid) {
          control?.markAsTouched();
        }
      });
      return;
    }

    this.isLoading.set(true);

    const menuData: Menu = {
      name: formValue.name,
      type: formValue.type,
      order: formValue.order || 1,
      ...(formValue.type === 'internal' &&
        formValue.routerLink && { routerLink: formValue.routerLink }),
      ...(formValue.type === 'external' &&
        formValue.externalLink && { externalLink: formValue.externalLink }),
      ...(formValue.type === 'category' &&
        formValue.slug && { slug: formValue.slug }),
    };

    const menuToEdit = this.menuToEdit();
    const apiCall = menuToEdit
      ? this.menuService.update(menuToEdit?.id ?? 0, menuData)
      : this.menuService.create(menuData);

    apiCall.subscribe({
      next: (menu) => {
        this.isLoading.set(false);
        const action = menuToEdit ? 'atualizado' : 'criado';
        this.alertService.success('Sucesso', `Menu ${action} com sucesso!`);
        this.saveEvent.emit(menu as Menu);
        this.resetForm();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro ao salvar menu:', err);
        const action = menuToEdit ? 'atualizar' : 'criar';
        this.alertService.error(
          'Erro',
          `Erro ao ${action} menu. Tente novamente.`,
        );
      },
    });
  }

  private createMultipleCategoryMenus(): void {
    const selectedCats = this.selectedCategories();
    const nextOrder = this.calculateNextOrder();

    const validCats = selectedCats.filter((cat) => !!(cat.name && cat.slug));

    if (validCats.length === 0) {
      this.isLoading.set(false);
      return;
    }

    const menusData = validCats.map((category, index) => ({
      name: String(category.name).trim(),
      slug: String(category.slug).trim(),
      order: nextOrder + index,
    }));

    this.menuService.createCategoryMenus(menusData).subscribe({
      next: (menus) => {
        this.isLoading.set(false);
        const count = menus.length;
        this.alertService.success(
          'Sucesso',
          count === 1
            ? 'Menu criado com sucesso!'
            : `${count} menus criados com sucesso!`,
        );
        if (menus.length > 0) {
          this.saveEvent.emit(menus[menus.length - 1] as Menu);
        }
        this.resetForm();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro ao salvar menus de categorias:', err);
        this.alertService.error(
          'Erro',
          'Erro ao criar menus. Tente novamente.',
        );
      },
    });
  }

  resetForm(): void {
    const nextOrder = this.calculateNextOrder();
    this.menuForm.reset({ type: 'internal', order: nextOrder });
    this.selectedType.set('internal');
    this.selectedCategories.set([]);
    this.showCategoryDropdown.set(false);
  }

  onCancel(): void {
    this.resetForm();
    this.cancelEvent.emit();
  }
}
