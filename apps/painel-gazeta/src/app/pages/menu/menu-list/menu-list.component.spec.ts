import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuListComponent } from './menu-list.component';
import { MenuService } from '../../../core/services/menu.service';
import { AlertService } from '@site-gazeta/alert';
import { of, throwError } from 'rxjs';
import { Menu } from '@site-gazeta/models';

describe('MenuListComponent', () => {
  let component: MenuListComponent;
  let fixture: ComponentFixture<MenuListComponent>;
  let mockMenuService: any;
  let mockAlertService: any;

  const mockMenus: Menu[] = [
    {
      id: 1,
      name: 'Home',
      type: 'internal',
      routerLink: '/home',
      order: 1,
      slug: 'home',
      createdAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'Esportes',
      type: 'submenu',
      order: 2,
      slug: 'esportes',
      createdAt: '2024-01-02',
      children: [],
    },
    {
      id: 4,
      name: 'Contato',
      type: 'externalLink',
      externalLink: 'https://contato.com',
      order: 3,
      slug: 'contato',
      createdAt: '2024-01-04',
    },
  ];

  beforeEach(async () => {
    mockMenuService = {
      reorder: jest.fn().mockReturnValue(of({})),
      moveToSubmenu: jest.fn().mockReturnValue(of({})),
      delete: jest.fn().mockReturnValue(of({})),
    };

    mockAlertService = {
      success: jest.fn(),
      error: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MenuListComponent],
      providers: [
        { provide: MenuService, useValue: mockMenuService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('menus', mockMenus);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Signals', () => {
    it('should initialize with empty menuToDelete', () => {
      expect(component.menuToDelete()).toBeNull();
    });

    it('should initialize with showDeleteConfirm as false', () => {
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should initialize isReordering as false', () => {
      expect(component.isReordering()).toBe(false);
    });
  });

  describe('Config (Drag and Drop)', () => {
    it('should have correct config', () => {
      expect(component.config.getItemId).toBeDefined();
      expect(component.config.getItemOrder).toBeDefined();
    });

    it('should return correct id for menu', () => {
      const menu = mockMenus[0];
      expect(component.config.getItemId(menu)).toBe(1);
    });

    it('should return correct order for menu', () => {
      expect(component.config.getItemOrder!).toBeDefined();
    });
  });

  describe('editMenu', () => {
    it('should emit edit event', () => {
      const editSpy = jest.spyOn(component.edit, 'emit');
      const menu = mockMenus[0];

      component.editMenu(menu);

      expect(editSpy).toHaveBeenCalledWith(menu);
    });
  });

  describe('Modal Delete', () => {
    it('should open delete modal', () => {
      const menu = mockMenus[0];

      component.confirmDelete(menu);

      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.menuToDelete()).toEqual(menu);
    });

    it('should close modal on cancel', () => {
      component.confirmDelete(mockMenus[0]);
      component.cancelDelete();

      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.menuToDelete()).toBeNull();
    });

    it('should delete menu successfully', () => {
      component.confirmDelete(mockMenus[0]);

      component.deleteMenu();

      expect(mockMenuService.delete).toHaveBeenCalledWith(1);
    });

    it('should show success message for main menu', () => {
      component.confirmDelete(mockMenus[0]);

      component.deleteMenu();

      expect(mockAlertService.success).toHaveBeenCalledWith(
        'Sucesso',
        'Menu deletado com sucesso!',
      );
    });

    it('should emit delete event', () => {
      const deleteSpy = jest.spyOn(component.delete, 'emit');
      component.confirmDelete(mockMenus[0]);

      component.deleteMenu();

      expect(deleteSpy).toHaveBeenCalledWith(1);
    });

    it('should close modal after delete', () => {
      component.confirmDelete(mockMenus[0]);

      component.deleteMenu();

      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should handle delete error', () => {
      mockMenuService.delete.mockReturnValue(
        throwError(() => new Error('Delete failed')),
      );
      component.confirmDelete(mockMenus[0]);

      component.deleteMenu();

      expect(mockAlertService.error).toHaveBeenCalledWith(
        'Erro',
        'Erro ao deletar menu. Tente novamente.',
      );
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should do nothing when no menu to delete', () => {
      component.deleteMenu();

      expect(mockMenuService.delete).not.toHaveBeenCalled();
    });
  });

  describe('Reorder', () => {
    it('should have onReorder defined', () => {
      expect(component.config.onReorder).toBeDefined();
    });

    it('should have onMoveToParent defined', () => {
      expect(component.config.onMoveToParent).toBeDefined();
    });

    it('should have onRemoveFromParent defined', () => {
      expect(component.config.onRemoveFromParent).toBeDefined();
    });
  });

  describe('Helper Methods', () => {
    it('should get correct type label', () => {
      expect(component.getMenuTypeLabel('internal')).toBe('Página Interna');
      expect(component.getMenuTypeLabel('externalLink')).toBe('Link Externo');
      expect(component.getMenuTypeLabel('submenu')).toBe('Submenu');
    });

    it('should get menu destination for internal', () => {
      const menu = mockMenus[0];
      expect(component.getMenuDestination(menu)).toBe('/home');
    });

    it('should get menu destination for externalLink', () => {
      const menu = mockMenus[2];
      expect(component.getMenuDestination(menu)).toBe('https://contato.com');
    });
  });

  describe('openSubmenuModal', () => {
    it('should emit submenuClick for submenu type', () => {
      const emitSpy = jest.spyOn(component.submenuClick, 'emit');
      const submenu = mockMenus[1];

      component.openSubmenuModal(submenu);

      expect(emitSpy).toHaveBeenCalledWith(submenu);
    });

    it('should not emit for non-submenu type', () => {
      const emitSpy = jest.spyOn(component.submenuClick, 'emit');
      const menu = mockMenus[0];

      component.openSubmenuModal(menu);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
