import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryListComponent } from './category-list.component';
import { Category } from '@site-gazeta/models';

describe('CategoryListComponent', () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;

  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Esportes',
      slug: 'esportes',
      color: '#ff0000',
      description: 'Esportes',
      createdAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'Política',
      slug: 'politica',
      color: '#00ff00',
      description: 'Política',
      createdAt: '2024-01-02',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', mockCategories);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Signals', () => {
    it('should initialize with empty searchTerm', () => {
      expect(component.searchTerm()).toBe('');
    });

    it('should initialize with orderBy as newest', () => {
      expect(component.orderBy()).toBe('newest');
    });

    it('should initialize with statusFilter as all', () => {
      expect(component.statusFilter()).toBe('all');
    });
  });

  describe('filteredCategories', () => {
    it('should return all categories when no filter', () => {
      expect(component.filteredCategories().length).toBe(2);
    });

    it('should filter by search term', () => {
      component.searchTerm.set('esp');
      expect(component.filteredCategories().length).toBe(1);
      expect(component.filteredCategories()[0].name).toBe('Esportes');
    });
  });
});
