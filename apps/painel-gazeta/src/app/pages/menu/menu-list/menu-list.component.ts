import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragHandle } from '@angular/cdk/drag-drop';
import { DragAndDropComponent, DraggableListConfig } from '@site-gazeta/drag-and-drop';
import { MenuService } from '../../../core/services/menu.service';
import { Menu } from '@site-gazeta/models';
import { AlertService } from '@site-gazeta/alert';
import { ModalComponent } from '@site-gazeta/modal';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, DragDropModule, DragAndDropComponent, CdkDragHandle, ModalComponent, MatIconModule],
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.scss',
})
export class MenuListComponent {
  private menuService = inject(MenuService);
  private alertService = inject(AlertService);

  // Inputs & Outputs
  menus = input.required<Menu[]>();
  edit = output<Menu>();
  delete = output<number>();
  reorder = output<Menu[]>();
  submenuClick = output<Menu>();

  // Signals
  isReordering = signal(false);
  menuToDelete = signal<Menu | null>(null);
  showDeleteConfirm = signal(false);

  // Configuração do Drag and Drop
  config: DraggableListConfig<Menu> = {
    getItemId: (item: Menu) => item.id ?? 0,
    getItemOrder: (item: Menu) => item.order ?? 1,
    isItemExpandable: (item: Menu) => item.type === 'submenu',
    canDropInParent: () => false, // Desabilitado: não permite mais drop em submenus
    onReorder: (items: Menu[]) => this.saveOrder(items),
    onMoveToParent: () => { /* Desabilitado */ },
    onRemoveFromParent: (childId: number | string) => 
      this.removeFromSubmenu(childId as number),
  };

  private saveOrder(menus: Menu[]): void {
    this.isReordering.set(true);
    const orderData = {
      menus: menus.map(m => ({ id: m.id ?? 0, order: m.order ?? 1 }))
    };

    this.menuService.reorder(orderData).subscribe({
      next: () => {
        this.isReordering.set(false);
        this.reorder.emit(menus);
      },
      error: (err) => {
        this.isReordering.set(false);
        console.error('Erro ao reordenar menus:', err);
      }
    });
  }

  private moveToSubmenu(menuId: number, parentId: number): void {
    this.isReordering.set(true);
    this.menuService.moveToSubmenu(menuId, parentId).subscribe({
      next: () => {
        this.isReordering.set(false);
        this.reorder.emit([]);
      },
      error: (err) => {
        this.isReordering.set(false);
        console.error('Erro ao mover menu para submenu:', err);
      }
    });
  }

  removeFromSubmenu(childId: number): void {
    this.isReordering.set(true);
    this.menuService.moveToSubmenu(childId, null).subscribe({
      next: () => {
        this.isReordering.set(false);
        this.reorder.emit([]);
      },
      error: (err) => {
        this.isReordering.set(false);
        console.error('Erro ao remover menu do submenu:', err);
      }
    });
  }

  editMenu(menu: Menu): void {
    this.edit.emit(menu);
  }

  confirmDelete(menu: Menu): void {
    this.menuToDelete.set(menu);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.menuToDelete.set(null);
    this.showDeleteConfirm.set(false);
  }

  deleteMenu(): void {
    const menu = this.menuToDelete();
    if (!menu?.id) return;

    this.menuService.delete(menu.id).subscribe({
      next: () => {
        const isSubmenu = menu.parentId !== null && menu.parentId !== undefined;
        const message = isSubmenu 
          ? 'Submenu deletado permanentemente!' 
          : 'Menu deletado com sucesso!';
        
        this.alertService.success('Sucesso', message);
        this.delete.emit(menu.id ?? 0);
        this.cancelDelete();
      },
      error: (err) => {
        console.error('Erro ao deletar menu:', err);
        this.alertService.error('Erro', 'Erro ao deletar menu. Tente novamente.');
        this.cancelDelete();
      }
    });
  }

  getMenuTypeLabel(type?: string): string {
    const types: Record<string, string> = {
      internal: 'Página Interna',
      externalLink: 'Link Externo',
      category: 'Categoria',
      submenu: 'Submenu'
    };
    return types[type || 'internal'] || 'Desconhecido';
  }

  getMenuTypeIcon(type?: string): string {
    const icons: Record<string, string> = {
      internal: 'home',
      externalLink: 'open_in_new',
      category: 'label',
      submenu: 'arrow_drop_down'
    };
    return icons[type || 'internal'] || 'link';
  }

  getMenuDestination(menu: Menu): string {
    switch (menu.type) {
      case 'internal':
        return menu.routerLink || '/';
      case 'externalLink':
        return menu.externalLink || '';
      case 'category':
        return `/categoria/${menu.slug}`;
      case 'submenu':
        return `${menu.children?.length || 0} item(ns)`;
      default:
        return '-';
    }
  }

  openSubmenuModal(menu: Menu): void {
    if (menu.type === 'submenu') {
      this.submenuClick.emit(menu);
    }
  }
}