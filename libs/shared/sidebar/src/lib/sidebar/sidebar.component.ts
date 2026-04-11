import { RouterModule } from '@angular/router';
import { Component, input, signal, effect, OnDestroy, model, output, inject, Renderer2, DOCUMENT, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Menu } from '@site-gazeta/models';

@Component({
  selector: 'lib-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    '[class.is-static]': 'type() === "static"',
    '[class.sidebar_opened]': 'isOpened_()',
  }
})
export class SidebarComponent implements OnDestroy {
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  backdrop = input(true);
  type = input<'overlay' | 'static'>('overlay');
  opened = model<boolean>(false);
  menuItems = input< Menu[]>([]);
  adminMode = input<boolean>(false);
  painelItems = input();

  isOpened_ = signal<boolean>(false);
  expandedMenus = signal<Set<string>>(new Set());

  isOpened = output<boolean>();

  constructor() {
    effect(() => {
      this.isOpened_.set(this.opened());
      this.isOpened.emit(this.isOpened_());
    });

    effect(() => {
      // Só manipula o DOM se estivermos no browser
      if (this.isBrowser && this.type() === 'overlay' && this.backdrop()) {
        if (this.isOpened_()) {
          this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
        } else {
          this.renderer.removeStyle(this.document.body, 'overflow');
        }
      }
    });
  }

  toggleSidebar() {
    const newState = !this.opened();
    this.opened.set(newState);
  }

  closeSidebar() {
    this.opened.set(false);
  }

  toggleMenu(menuName: string) {
    const expanded = this.expandedMenus();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(menuName)) {
      newExpanded.delete(menuName);
    } else {
      newExpanded.add(menuName);
    }

    this.expandedMenus.set(newExpanded);
  }

  isMenuExpanded(menuName: string): boolean {
    return this.expandedMenus().has(menuName);
  }

  hasChildren(menu: Menu): boolean {
    return menu.children ? menu.children.length > 0 : false;
  }

  ngOnDestroy() {
    // Só limpa o overflow se estivermos no browser
    if (this.isBrowser && this.type() === 'overlay' && this.backdrop()) {
      this.renderer.removeStyle(this.document.body, 'overflow');
    }
  }
}
