import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryComponent } from './category.component';
import { CategoryService } from '../../core/services/category.service';
import { AlertService } from '@site-gazeta/alert';
import { of, throwError } from 'rxjs';
import { Category } from '@site-gazeta/models';

describe('CategoryComponent', () => {
  let component: CategoryComponent;
  let fixture: ComponentFixture<CategoryComponent>;
  let mockCategoryService: any;
  let mockAlertService: any;

  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Esportes',
      description: 'Notícias esportivas',
      color: '#FF0000',
      isActive: true,
      slug: 'esportes',
      createdAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'Política',
      description: 'Notícias políticas',
      color: '#00FF00',
      isActive: false,
      slug: 'politica',
      createdAt: '2024-01-02',
    },
  ];

  beforeEach(async () => {
    mockCategoryService = {
      getAll: jest.fn().mockReturnValue(of(mockCategories)),
      delete: jest.fn().mockReturnValue(of({})),
      update: jest.fn().mockReturnValue(of({ isActive: true })),
    };

    mockAlertService = {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CategoryComponent],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load categories on init', () => {
      expect(mockCategoryService.getAll).toHaveBeenCalled();
      expect(component.categories()).toEqual(mockCategories);
    });
  });

  describe('Signals', () => {
    it('should initialize with empty categoryToDelete', () => {
      expect(component.categoryToDelete()).toBeNull();
    });

    it('should initialize with showDeleteConfirm as false', () => {
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should initialize editingCategory as null', () => {
      expect(component.editingCategory()).toBeNull();
    });

    it('should compute used colors', () => {
      const colors = component.usedColors();
      expect(colors).toContain('#FF0000');
      expect(colors).toContain('#00FF00');
      expect(colors.length).toBe(2);
    });
  });

  describe('onCategorySubmit', () => {
    it('should update existing category', () => {
      const updatedCategory: Category = {
        ...mockCategories[0],
        name: 'Esportes Atualizado',
      };

      component.onCategorySubmit(updatedCategory);

      expect(component.editingCategory()).toBeNull();
      expect(component.categories()[0].name).toBe('Esportes Atualizado');
    });

    it('should add new category when id does not exist', () => {
      const newCategory: Category = {
        id: 3,
        name: 'Tecnologia',
        description: 'Notícias de tecnologia',
        color: '#0000FF',
        isActive: true,
        slug: 'tecnologia',
        createdAt: '2024-01-03',
      };

      component.onCategorySubmit(newCategory);

      expect(component.categories().length).toBe(3);
      expect(component.categories()[2]).toEqual(newCategory);
    });
  });

  describe('onEditCategory', () => {
    it('should set category to edit', () => {
      const category = mockCategories[0];
      component.onEditCategory(category);
      expect(component.editingCategory()).toEqual(category);
    });
  });

  describe('onCancelEdit', () => {
    it('should clear editingCategory', () => {
      component.onEditCategory(mockCategories[0]);
      component.onCancelEdit();
      expect(component.editingCategory()).toBeNull();
    });
  });

  describe('onDeleteCategory (modal)', () => {
    it('should open delete modal with category', () => {
      const category = mockCategories[0];
      component.onDeleteCategory(category);
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.categoryToDelete()).toEqual(category);
    });
  });

  describe('cancelDelete', () => {
    it('should close modal and clear category', () => {
      component.onDeleteCategory(mockCategories[0]);
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.categoryToDelete()).toBeNull();
    });
  });

  describe('confirmDeleteCategory', () => {
    it('should do nothing when no category selected', () => {
      component.confirmDeleteCategory();
      expect(mockCategoryService.delete).not.toHaveBeenCalled();
    });
  });

  describe('onToggleStatus', () => {
    it('should call update service', () => {
      const category = mockCategories[0];
      component.onToggleStatus(category);
      expect(mockCategoryService.update).toHaveBeenCalled();
    });
  });
});
