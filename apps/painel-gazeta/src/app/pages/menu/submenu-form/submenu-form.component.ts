import {
  Component,
  effect,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Menu } from '@site-gazeta/models';
import { MultiSelectComponent } from '@site-gazeta/multi-select';
import { MatIconModule } from '@angular/material/icon';
import { SelectModule } from 'primeng/select';
import { MenuFormBase } from '../menu-form.base';

@Component({
  selector: 'app-submenu-form',
  standalone: true,
  imports: [ReactiveFormsModule, MultiSelectComponent, MatIconModule, SelectModule],
  templateUrl: './submenu-form.component.html',
  styleUrl: './submenu-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmenuFormComponent extends MenuFormBase {
  // Inputs & Outputs
  parentMenu = input.required<Menu>();
  existingMenus = input<Menu[]>([]);
  allMenus = input.required<Menu[]>();
  saveEvent = output<Menu>();
  cancelEvent = output<void>();

  constructor() {
    super();
    this.initBaseForm({ parentId: [null] });
    this.loadCategories();

    // Effect para atualizar parentId quando parentMenu mudar
    effect(() => {
      const parent = this.parentMenu();
      if (parent?.id) {
        this.menuForm.patchValue({ parentId: parent.id }, { emitEvent: false });
        const nextOrder = this.calculateNextOrder();
        this.menuForm.patchValue({ order: nextOrder }, { emitEvent: false });
      }
    });
  }

  private calculateNextOrder(): number {
    const allMenus = this.allMenus();
    if (allMenus && allMenus.length > 0) {
      const getAllOrders = (menus: Menu[]): number[] => {
        const orders: number[] = [];
        menus.forEach((menu) => {
          if (menu.order) orders.push(menu.order);
          if (menu.children && menu.children.length > 0) {
            orders.push(...getAllOrders(menu.children));
          }
        });
        return orders;
      };

      const allOrders = getAllOrders(allMenus);
      if (allOrders.length > 0) {
        const maxOrder = Math.max(...allOrders);
        return maxOrder + 1;
      }
    }
    return 1;
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
      console.warn('Nenhuma categoria selecionada (submenu)');
      this.alertService.warning(
        'Atenção',
        'Por favor, selecione pelo menos uma categoria',
      );
      return;
    }

    if (this.menuForm.invalid) {
      console.error('Formulário inválido (submenu):', this.menuForm.errors);
      Object.keys(this.menuForm.controls).forEach((key) => {
        const control = this.menuForm.get(key);
        if (control?.invalid) {
          control?.markAsTouched();
        }
      });
      return;
    }

    this.isLoading.set(true);
    const parentMenu = this.parentMenu();

    const parentId = formValue.parentId || parentMenu?.id || null;
    const finalOrder = this.calculateNextOrder();

    const menuData: Menu = {
      name: formValue.name,
      type: formValue.type,
      order: finalOrder,
      ...(formValue.type === 'internal' &&
        formValue.routerLink && { routerLink: formValue.routerLink }),
      ...(formValue.type === 'external' &&
        formValue.externalLink && { externalLink: formValue.externalLink }),
      ...(formValue.type === 'category' &&
        formValue.slug && { slug: formValue.slug }),
      ...(parentId && { parentId }),
    };

    this.menuService.create(menuData).subscribe({
      next: (menu) => {
        this.isLoading.set(false);
        this.alertService.success('Sucesso', 'Submenu criado com sucesso!');
        this.saveEvent.emit(menu as Menu);
        this.resetForm();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro ao salvar menu:', err);
        this.alertService.error(
          'Erro',
          'Erro ao criar submenu. Tente novamente.',
        );
      },
    });
  }

  private createMultipleCategoryMenus(): void {
    const selectedCats = this.selectedCategories();
    const parentMenu = this.parentMenu();
    const formValue = this.menuForm.value;

    const parentId = formValue.parentId || parentMenu?.id || null;
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

    this.menuService.createCategoryMenus(menusData, parentId).subscribe({
      next: (menus) => {
        this.isLoading.set(false);
        const count = menus.length;
        this.alertService.success(
          'Sucesso',
          count === 1
            ? 'Submenu criado com sucesso!'
            : `${count} submenus criados com sucesso!`,
        );
        if (menus.length > 0) {
          this.saveEvent.emit(menus[menus.length - 1] as Menu);
        }
        this.resetForm();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro ao salvar menus de categorias (submenu):', err);
        this.alertService.error(
          'Erro',
          'Erro ao criar submenus. Tente novamente.',
        );
      },
    });
  }

  resetForm(): void {
    const nextOrder = this.calculateNextOrder();
    const parentMenu = this.parentMenu();
    const parentId = parentMenu?.id || null;
    this.menuForm.reset({ type: 'internal', order: nextOrder, parentId });
    this.selectedType.set('internal');
    this.selectedCategories.set([]);
  }

  onCancel(): void {
    this.resetForm();
    this.cancelEvent.emit();
  }
}
