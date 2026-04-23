import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, switchMap, tap, finalize } from 'rxjs';
import { MenuFormComponent } from './menu-form/menu-form.component';
import { SubmenuFormComponent } from './submenu-form/submenu-form.component';
import { MenuListComponent } from './menu-list/menu-list.component';
import { MenuService } from '../../core/services/menu.service';
import { Menu } from '@site-gazeta/models';
import { ModalComponent } from '@site-gazeta/modal';
import { MatIconModule } from '@angular/material/icon';

interface MenuComponentState {
  menuToEdit: Menu | null;
  selectedSubmenu: Menu | null;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    MenuFormComponent,
    SubmenuFormComponent,
    MenuListComponent,
    ModalComponent,
    MatIconModule,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  private menuService = inject(MenuService);
  // Estado do componente usando signals
  state = signal<MenuComponentState>({
    menuToEdit: null,
    selectedSubmenu: null,
  });

  private refresh$ = new BehaviorSubject<void>(undefined);

  // Signals para dados
  isLoading = signal(false);
  isSubmenuModalOpen = signal(false);

  menus = toSignal(
    this.refresh$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => this.menuService.getAll().pipe(
        finalize(() => this.isLoading.set(false))
      ))
    ),
    { initialValue: [] }
  );

  isFormVisible = signal(false);

  // Computed signals
  isEdit = computed(() => !!this.state().menuToEdit);
  selectedSubmenu = computed(() => this.state().selectedSubmenu);

  openNewMenuForm(): void {
    this.state.update((state) => ({ ...state, menuToEdit: null }));
    this.isFormVisible.set(true);
  }

  openSubmenuModal(submenu: Menu): void {
    this.state.update((state) => ({
      ...state,
      selectedSubmenu: submenu,
    }));
    this.isSubmenuModalOpen.set(true);
  }

  closeSubmenuModal(): void {
    this.isSubmenuModalOpen.set(false);
    this.state.update((state) => ({
      ...state,
      selectedSubmenu: null,
    }));
  }
  loadMenus(): void {
    this.refresh$.next();
  }

  handleSave(): void {
    this.loadMenus();
    this.state.update((state) => ({ ...state, menuToEdit: null }));
    this.isFormVisible.set(false);
  }

  handleEdit(menu: Menu): void {
    this.state.update((state) => ({ ...state, menuToEdit: menu }));
    this.isFormVisible.set(true);
  }

  handleDelete(): void {
    // Recarregar do backend após deletar para garantir consistência
    // (especialmente se for um submenu com children)
    this.loadMenus();
  }

  handleReorder(reorderedMenus: Menu[]): void {
    // Recarrega os menus do backend após qualquer reordenação
    this.loadMenus();
  }

  handleCancel(): void {
    this.state.update((state) => ({ ...state, menuToEdit: null }));
    this.isFormVisible.set(false);
  }

  handleSubmenuSave(): void {
    // Recarregar menus para atualizar a lista
    this.loadMenus();
    // Não fechar o modal automaticamente para permitir adicionar mais itens
    // this.closeSubmenuModal();
  }
}
