import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuFormComponent } from './menu-form/menu-form.component';
import { SubmenuFormComponent } from './submenu-form/submenu-form.component';
import { MenuListComponent } from './menu-list/menu-list.component';
import { MenuService } from '../../core/services/menu.service';
import { Menu } from '@site-gazeta/models';
import { ModalComponent } from '@site-gazeta/modal';

interface MenuComponentState {
  menuToEdit: Menu | null;
  selectedSubmenu: Menu | null;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    MenuFormComponent,
    SubmenuFormComponent,
    MenuListComponent,
    ModalComponent,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit {
  private menuService = inject(MenuService);
  // Estado do componente usando signals
  state = signal<MenuComponentState>({
    menuToEdit: null,
    selectedSubmenu: null,
  });

  // Signals para dados
  menus = signal<Menu[]>([]);
  isLoading = signal(false);
  isSubmenuModalOpen = signal(false);

  // Computed signals
  isEdit = computed(() => !!this.state().menuToEdit);
  selectedSubmenu = computed(() => this.state().selectedSubmenu);

  ngOnInit(): void {
    this.loadMenus();
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
    this.isLoading.set(true);
    this.menuService.getAll().subscribe({
      next: (menus) => {
        this.menus.set(menus);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar menus:', err);
        this.isLoading.set(false);
      },
    });
  }

  handleSave(): void {
    this.loadMenus();
    this.state.update((state) => ({
      ...state,
      menuToEdit: null,
    }));
  }

  handleEdit(menu: Menu): void {
    this.state.update((state) => ({
      ...state,
      menuToEdit: menu,
    }));
  }

  handleDelete(): void {
    // Recarregar do backend após deletar para garantir consistência
    // (especialmente se for um submenu com children)
    this.loadMenus();
  }

  handleReorder(reorderedMenus: Menu[]): void {
    // Se receber array vazio, significa que precisa recarregar do backend
    // (moveu item para/de submenu)
    if (reorderedMenus.length === 0) {
      this.loadMenus();
    } else {
      // Reordenação simples, atualiza localmente
      this.menus.set(reorderedMenus);
    }
  }

  handleCancel(): void {
    this.state.update((state) => ({
      ...state,
      menuToEdit: null,
    }));
  }

  handleSubmenuSave(): void {
    // Recarregar menus para atualizar a lista
    this.loadMenus();
    // Não fechar o modal automaticamente para permitir adicionar mais itens
    // this.closeSubmenuModal();
  }
}
