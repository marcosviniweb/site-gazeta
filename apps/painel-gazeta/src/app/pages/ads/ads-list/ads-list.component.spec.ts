import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AdsListComponent } from './ads-list.component';
import { AdsService } from '../../../core/services/ads.service';
import { AlertService } from '@site-gazeta/alert';
import { of, throwError } from 'rxjs';
import { Ads } from '@site-gazeta/models';

Object.defineProperty(window, 'scrollTo', { value: jest.fn() });

describe('AdsListComponent', () => {
  let component: AdsListComponent;
  let fixture: ComponentFixture<AdsListComponent>;
  let mockAdsService: any;
  let mockAlertService: any;

  const mockAds: Ads[] = [
    {
      id: 1,
      title: 'Anúncio 1',
      description: 'Desc 1',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      image: 'img1.jpg',
      clickUrl: 'http://1.com',
      position: 'top',
      placement: 'home',
      size: '300x250',
      isActive: true,
      priority: 1,
      imageUrl: 'img1.jpg',
    },
    {
      id: 2,
      title: 'Anúncio 2',
      description: 'Desc 2',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      image: 'img2.jpg',
      clickUrl: 'http://2.com',
      position: 'sidebar',
      placement: 'news',
      size: '300x250',
      isActive: false,
      priority: 2,
      imageUrl: 'img2.jpg',
    },
    {
      id: 3,
      title: 'Anúncio 3',
      description: 'Desc 3',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      image: 'img3.jpg',
      clickUrl: 'http://3.com',
      position: 'bottom',
      placement: 'home',
      size: '300x250',
      isActive: true,
      priority: 3,
      imageUrl: 'img3.jpg',
    },
  ];

  const mockResponse = {
    data: mockAds,
    meta: { total: 3, lastPage: 1, page: 1, limit: 25 },
  };

  beforeEach(async () => {
    mockAdsService = {
      getAll: jest.fn().mockReturnValue(of(mockResponse)),
      toggleActive: jest.fn().mockReturnValue(of({})),
      delete: jest.fn().mockReturnValue(of({})),
    };

    mockAlertService = {
      success: jest.fn(),
      error: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdsListComponent],
      providers: [
        { provide: AdsService, useValue: mockAdsService },
        { provide: AlertService, useValue: mockAlertService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State Signals', () => {
    it('should load advertisements after init', () => {
      expect(component.advertisements().length).toBeGreaterThan(0);
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
      expect(component.adToDelete()).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should load advertisements on init', () => {
      expect(mockAdsService.getAll).toHaveBeenCalled();
    });
  });

  describe('loadAdvertisements', () => {
    it('should load advertisements with default params', () => {
      component.loadAdvertisements();
      expect(mockAdsService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 25,
        }),
      );
    });

    it('should load advertisements when called', () => {
      const initialLength = component.advertisements().length;
      component.loadAdvertisements();
      expect(component.advertisements().length).toBeGreaterThanOrEqual(
        initialLength,
      );
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
  });

  describe('Selection', () => {
    it('should select all ads', () => {
      component.advertisements.set(mockAds);
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

    it('should check if all are selected', () => {
      component.advertisements.set(mockAds);
      component.selectedIds.set(new Set([1, 2, 3]));
      expect(component.isAllSelected()).toBe(true);
    });
  });

  describe('Modal Delete', () => {
    it('should open delete modal', () => {
      const ad = mockAds[0];
      component.confirmDelete(ad);
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.adToDelete()).toEqual(ad);
    });

    it('should close modal on cancel', () => {
      component.confirmDelete(mockAds[0]);
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.adToDelete()).toBeNull();
    });

    it('should delete ad successfully', () => {
      component.confirmDelete(mockAds[0]);
      component.deleteAdvertisement();
      expect(mockAdsService.delete).toHaveBeenCalledWith(1);
    });

    it('should show success after delete', () => {
      component.confirmDelete(mockAds[0]);
      component.deleteAdvertisement();
      expect(mockAlertService.success).toHaveBeenCalledWith(
        'Excluído',
        'O anúncio foi excluído com sucesso',
      );
    });

    it('should handle delete error', () => {
      mockAdsService.delete.mockReturnValue(
        throwError(() => new Error('Delete failed')),
      );
      component.confirmDelete(mockAds[0]);
      component.deleteAdvertisement();
      expect(mockAlertService.error).toHaveBeenCalled();
    });
  });

  describe('toggleStatus', () => {
    it('should toggle ad status', () => {
      component.toggleStatus(mockAds[0]);
      expect(mockAdsService.toggleActive).toHaveBeenCalledWith(1);
    });

    it('should not toggle if id is undefined', () => {
      component.toggleStatus({} as Ads);
      expect(mockAdsService.toggleActive).not.toHaveBeenCalled();
    });
  });

  describe('Filters', () => {
    it('should set filter date and reload', () => {
      component.setFilterDate('2024-01-01');
      expect(component.filterDate()).toBe('2024-01-01');
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter order and reload', () => {
      component.setFilterOrder('desc');
      expect(component.filterOrder()).toBe('desc');
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter position and reload', () => {
      component.setFilterPosition('top');
      expect(component.filterPosition()).toBe('top');
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter placement and reload', () => {
      component.setFilterPlacement('home');
      expect(component.filterPlacement()).toBe('home');
      expect(component.currentPage()).toBe(1);
    });

    it('should set filter status and reload', () => {
      component.setFilterStatus(true);
      expect(component.filterStatus()).toBe(true);
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('Helper Methods', () => {
    it('should get placement name', () => {
      expect(component.getPlacementName('home')).toBe('Página Inicial');
      expect(component.getPlacementName('news')).toBe('Página de Notícia');
    });

    it('should get position name', () => {
      expect(component.getPositionName('top')).toBe('Topo Principal');
      expect(component.getPositionName('sidebar')).toBe('Barra Lateral');
      expect(component.getPositionName('unknown')).toBe('unknown');
    });
  });

  describe('editAdvertisement', () => {
    it('should navigate to ad edit page', () => {
      const routerSpy = jest.spyOn(component['router'], 'navigate');
      component.editAdvertisement(mockAds[0]);
      expect(routerSpy).toHaveBeenCalledWith(['/ads', 1]);
    });
  });
});
