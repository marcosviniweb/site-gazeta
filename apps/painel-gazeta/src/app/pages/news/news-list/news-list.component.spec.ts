import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NewsListComponent } from './news-list.component';
import { NewsService } from '../../../core/services/news.service';
import { CategoryService } from '../../../core/services/category.service';
import { AlertService } from '@site-gazeta/alert';
import { of, throwError } from 'rxjs';
import { News, Category } from '@site-gazeta/models';

Object.defineProperty(window, 'scrollTo', { value: jest.fn() });
Object.defineProperty(window, 'open', { value: jest.fn() });

describe('NewsListComponent', () => {
  let component: NewsListComponent;
  let fixture: ComponentFixture<NewsListComponent>;
  let mockNewsService: any;
  let mockCategoryService: any;
  let mockAlertService: any;

  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Esportes',
      description: 'Notícias esportivas',
      color: '#FF0000',
      slug: 'esportes',
      isActive: true,
      createdAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'Política',
      description: 'Notícias políticas',
      color: '#00FF00',
      slug: 'politica',
      isActive: true,
      createdAt: '2024-01-02',
    },
  ];

  const mockNews: News[] = [
    {
      id: 1,
      title: 'Notícia 1',
      subtitle: 'Subtítulo 1',
      content: 'Conteúdo 1',
      author: 'Autor 1',
      status: 'ACTIVE',
      views: 100,
      published: '2024-01-01',
      categoryId: [1],
      slug: 'noticia-1',
      createdAt: '2024-01-01',
      updateAt: '2024-01-01',
      mediaNews: [],
      videoNews: [],
      isEmphasis: false,
    },
    {
      id: 2,
      title: 'Notícia 2',
      subtitle: 'Subtítulo 2',
      content: 'Conteúdo 2',
      author: 'Autor 2',
      status: 'INACTIVE',
      views: 200,
      published: '2024-01-02',
      categoryId: [2],
      slug: 'noticia-2',
      createdAt: '2024-01-02',
      updateAt: '2024-01-02',
      mediaNews: [],
      videoNews: [],
      isEmphasis: false,
    },
    {
      id: 3,
      title: 'Notícia 3',
      subtitle: 'Subtítulo 3',
      content: 'Conteúdo 3',
      author: 'Autor 3',
      status: 'ACTIVE',
      views: 300,
      published: '2024-01-03',
      categoryId: [1, 2],
      slug: 'noticia-3',
      createdAt: '2024-01-03',
      updateAt: '2024-01-03',
      mediaNews: [],
      videoNews: [],
      isEmphasis: true,
    },
  ];

  const mockResponse = {
    data: mockNews,
    meta: { total: 3, lastPage: 1, page: 1, limit: 25 },
  };

  beforeEach(async () => {
    mockNewsService = {
      getAll: jest.fn().mockReturnValue(of(mockResponse)),
      update: jest.fn().mockReturnValue(of({})),
      updateEmphasis: jest.fn().mockReturnValue(of({})),
      delete: jest.fn().mockReturnValue(of({})),
    };

    mockCategoryService = {
      getAll: jest.fn().mockReturnValue(of(mockCategories)),
    };

    mockAlertService = {
      success: jest.fn(),
      error: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NewsListComponent],
      providers: [
        { provide: NewsService, useValue: mockNewsService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: AlertService, useValue: mockAlertService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State Signals', () => {
    it('should load news after init', () => {
      expect(component.news().length).toBeGreaterThan(0);
    });

    it('should load categories after init', () => {
      expect(component.categories().length).toBeGreaterThan(0);
    });

    it('should not be loading after init', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should initialize currentPage as 1', () => {
      expect(component.currentPage()).toBe(1);
    });

    it('should initialize with empty selectedIds', () => {
      expect(component.selectedIds().size).toBe(0);
    });

    it('should initialize isProcessing as false', () => {
      expect(component.isProcessing()).toBe(false);
    });

    it('should initialize modal signals as false/null', () => {
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.itemToDelete()).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should load categories on init', () => {
      expect(mockCategoryService.getAll).toHaveBeenCalled();
    });

    it('should load news on init', () => {
      expect(mockNewsService.getAll).toHaveBeenCalled();
    });

    it('should load total featured on init', () => {
      expect(mockNewsService.getAll).toHaveBeenCalledWith({
        isEmphasis: true,
        limit: 1,
      });
    });
  });

  describe('loadNews', () => {
    it('should load news with default params', () => {
      component.loadNews();
      expect(mockNewsService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 25,
          status: 'ACTIVE',
        }),
      );
    });

    it('should load news when called', () => {
      const initialLength = component.news().length;
      component.loadNews();
      expect(component.news().length).toBeGreaterThanOrEqual(initialLength);
    });
  });

  describe('Pagination', () => {
    it('should go to next page', () => {
      component.lastPage.set(5);
      component.nextPage();
      expect(component.currentPage()).toBe(2);
    });

    it('should not go past last page', () => {
      component.currentPage.set(5);
      component.lastPage.set(5);
      component.nextPage();
      expect(component.currentPage()).toBe(5);
    });

    it('should go to previous page', () => {
      component.currentPage.set(3);
      component.prevPage();
      expect(component.currentPage()).toBe(2);
    });

    it('should not go below page 1', () => {
      component.currentPage.set(1);
      component.prevPage();
      expect(component.currentPage()).toBe(1);
    });

    it('should load news when changing page', () => {
      component.nextPage();
      expect(mockNewsService.getAll).toHaveBeenCalled();
    });
  });

  describe('Selection', () => {
    it('should select all news', () => {
      component.news.set(mockNews);
      const event = { target: { checked: true } } as unknown as Event;
      component.toggleSelectAll(event);
      expect(component.selectedIds().size).toBe(3);
    });

    it('should clear selection', () => {
      component.selectedIds.set(new Set([1, 2, 3]));
      component.clearSelection();
      expect(component.selectedIds().size).toBe(0);
    });

    it('should toggle single selection', () => {
      component.toggleSelection(1);
      expect(component.selectedIds().has(1)).toBe(true);
      component.toggleSelection(1);
      expect(component.selectedIds().has(1)).toBe(false);
    });

    it('should check if id is selected', () => {
      component.selectedIds.set(new Set([1]));
      expect(component.isSelected(1)).toBe(true);
      expect(component.isSelected(2)).toBe(false);
    });

    it('should check if all are selected', () => {
      component.news.set(mockNews);
      component.selectedIds.set(new Set([1, 2, 3]));
      expect(component.isAllSelected()).toBe(true);
    });

    it('should return false for empty news', () => {
      component.news.set([]);
      expect(component.isAllSelected()).toBe(false);
    });
  });

  describe('Modal Delete', () => {
    it('should open delete modal', () => {
      const news = mockNews[0];
      component.confirmDelete(news);
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.itemToDelete()).toEqual(news);
    });

    it('should close modal on cancel', () => {
      component.confirmDelete(mockNews[0]);
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.itemToDelete()).toBeNull();
    });

    it('should delete news successfully', () => {
      component.confirmDelete(mockNews[0]);
      component.deleteItem();
      expect(mockNewsService.delete).toHaveBeenCalledWith(1);
    });

    it('should show success after delete', () => {
      component.confirmDelete(mockNews[0]);
      component.deleteItem();
      expect(mockAlertService.success).toHaveBeenCalledWith(
        'Sucesso',
        'Notícia excluída permanentemente.',
      );
    });

    it('should close modal after delete', () => {
      component.confirmDelete(mockNews[0]);
      component.deleteItem();
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should handle delete error', () => {
      mockNewsService.delete.mockReturnValue(
        throwError(() => new Error('Delete failed')),
      );
      component.confirmDelete(mockNews[0]);
      component.deleteItem();
      expect(mockAlertService.error).toHaveBeenCalledWith(
        'Erro',
        'Falha ao excluir notícia.',
      );
    });

    it('should do nothing when no item to delete', () => {
      component.deleteItem();
      expect(mockNewsService.delete).not.toHaveBeenCalled();
    });
  });

  describe('Filters', () => {
    it('should set filter date and reload', () => {
      component.setFilterDate('2024-01-01');
      expect(component.filterDate()).toBe('2024-01-01');
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter views and reload', () => {
      component.setFilterViews('desc');
      expect(component.filterViews()).toBe('desc');
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter status and reload', () => {
      component.setFilterStatus('INACTIVE');
      expect(component.filterStatus()).toBe('INACTIVE');
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter category and reload', () => {
      component.setFilterCategory(1);
      expect(component.filterCategory()).toBe(1);
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter order and reload', () => {
      component.setFilterOrder('asc');
      expect(component.filterOrder()).toBe('asc');
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter emphasis and reload', () => {
      component.setFilterEmphasis(true);
      expect(component.filterEmphasis()).toBe(true);
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('Helper Methods', () => {
    it('should get category names', () => {
      component.categories.set(mockCategories);
      const names = component.getCategoryNames([1, 2]);
      expect(names).toBe('Esportes, Política');
    });

    it('should return Sem Categoria for empty categoryId', () => {
      const names = component.getCategoryNames([]);
      expect(names).toBe('Sem Categoria');
    });

    it('should detect if news has emphasis image', () => {
      const newsWithEmphasis = {
        mediaNews: [{ emphasis: true }],
      } as unknown as News;
      expect(component.hasNoEmphasisImage(newsWithEmphasis)).toBe(false);
    });

    it('should return true for news without emphasis image', () => {
      const newsWithoutEmphasis = { mediaNews: [] } as unknown as News;
      expect(component.hasNoEmphasisImage(newsWithoutEmphasis)).toBe(true);
    });

    it('should get featured image', () => {
      const news = {
        mediaNews: [
          {
            emphasis: true,
            imgSize: {
              small: 'small.jpg',
              medium: 'medium.jpg',
              original: 'original.jpg',
            },
          },
        ],
      } as unknown as News;
      const image = component.getFeaturedImage(news);
      expect(image).toBe('small.jpg');
    });

    it('should return null for news without media', () => {
      const image = component.getFeaturedImage({} as News);
      expect(image).toBeNull();
    });
  });

  describe('openNewsInSite', () => {
    it('should open news in site', () => {
      const openSpy = jest.spyOn(window, 'open');
      component.openNewsInSite('test-slug');
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('/news/test-slug'),
        '_blank',
      );
    });
  });

  describe('editNews', () => {
    it('should emit news event', () => {
      const emitSpy = jest.spyOn(component.newsEmitter, 'emit');
      const news = mockNews[0];
      component.editNews(news);
      expect(emitSpy).toHaveBeenCalledWith(news);
    });
  });
});
