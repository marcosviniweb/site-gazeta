import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { VideoListComponent } from './video-list.component';
import { VideoService } from '../../../core/services/video.service';
import { CategoryService } from '../../../core/services/category.service';
import { AlertService } from '@site-gazeta/alert';
import { of, throwError } from 'rxjs';
import { Video, Category } from '@site-gazeta/models';

Object.defineProperty(window, 'scrollTo', { value: jest.fn() });

describe('VideoListComponent', () => {
  let component: VideoListComponent;
  let fixture: ComponentFixture<VideoListComponent>;
  let mockVideoService: any;
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
  ];

  const mockVideos: Video[] = [
    {
      id: 1,
      title: 'Vídeo 1',
      url: 'http://video1.mp4',
      thumbnail: 'http://thumb1.jpg',
      views: 100,
      duration: '10:00',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      categories: [],
      featured: false,
      tags: [],
    },
    {
      id: 2,
      title: 'Vídeo 2',
      url: 'http://video2.mp4',
      thumbnail: 'http://thumb2.jpg',
      views: 200,
      duration: '15:00',
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
      categories: [],
      featured: true,
      tags: [],
    },
    {
      id: 3,
      title: 'Vídeo 3',
      url: 'http://video3.mp4',
      thumbnail: null,
      views: 300,
      duration: '20:00',
      createdAt: '2024-01-03',
      updatedAt: '2024-01-03',
      categories: [],
      featured: false,
      tags: [],
    },
  ];

  const mockResponse = {
    data: mockVideos,
    meta: { total: 3, lastPage: 1, page: 1, limit: 25 },
  };

  beforeEach(async () => {
    mockVideoService = {
      getAll: jest.fn().mockReturnValue(of(mockResponse)),
      update: jest.fn().mockReturnValue(of({})),
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
      imports: [VideoListComponent],
      providers: [
        { provide: VideoService, useValue: mockVideoService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: AlertService, useValue: mockAlertService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State Signals', () => {
    it('should load videos after init', () => {
      expect(component.videos().length).toBeGreaterThan(0);
    });

    it('should not be loading after init', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should initialize currentPage as 1', () => {
      expect(component.currentPage()).toBe(1);
    });

    it('should initialize playingVideoId as null', () => {
      expect(component.playingVideoId()).toBeNull();
    });

    it('should initialize with empty selectedIds', () => {
      expect(component.selectedIds().size).toBe(0);
    });

    it('should initialize isProcessing as false', () => {
      expect(component.isProcessing()).toBe(false);
    });

    it('should initialize modal signals as false/null', () => {
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.videoToDelete()).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should load categories on init', () => {
      expect(mockCategoryService.getAll).toHaveBeenCalled();
    });

    it('should load videos on init', () => {
      expect(mockVideoService.getAll).toHaveBeenCalled();
    });
  });

  describe('loadVideos', () => {
    it('should load videos with default params', () => {
      component.loadVideos();
      expect(mockVideoService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 25,
        }),
      );
    });
  });

  describe('Selection', () => {
    it('should select all videos', () => {
      component.videos.set(mockVideos);
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
      component.videos.set(mockVideos);
      component.selectedIds.set(new Set([1, 2, 3]));
      expect(component.isAllSelected()).toBe(true);
    });
  });

  describe('Modal Delete', () => {
    it('should open delete modal', () => {
      const video = mockVideos[0];
      component.confirmDelete(video);
      expect(component.showDeleteConfirm()).toBe(true);
      expect(component.videoToDelete()).toEqual(video);
    });

    it('should close modal on cancel', () => {
      component.confirmDelete(mockVideos[0]);
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.videoToDelete()).toBeNull();
    });

    it('should call delete service', () => {
      component.confirmDelete(mockVideos[0]);
      component.deleteVideo();
      expect(mockVideoService.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('Video Playback', () => {
    it('should set playing video id', () => {
      component.togglePlayVideo(1);
      expect(component.playingVideoId()).toBe(1);
    });

    it('should stop playing when toggling same video', () => {
      component.playingVideoId.set(1);
      component.togglePlayVideo(1);
      expect(component.playingVideoId()).toBeNull();
    });

    it('should check if video is playing', () => {
      component.playingVideoId.set(1);
      expect(component.isPlaying(1)).toBe(true);
      expect(component.isPlaying(2)).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should format duration with colons', () => {
      expect(component.formatDuration('10:30')).toBe('10:30');
    });

    it('should format duration without colons', () => {
      expect(component.formatDuration('630')).toBe('10:30');
    });

    it('should format duration with hours', () => {
      expect(component.formatDuration('3660')).toBe('01:01:00');
    });

    it('should return 00:00 for undefined duration', () => {
      expect(component.formatDuration(undefined)).toBe('00:00');
    });
  });

  describe('editVideo', () => {
    it('should navigate to video edit page', () => {
      const routerSpy = jest.spyOn(component['router'], 'navigate');
      const video = mockVideos[0];
      component.editVideo(video);
      expect(routerSpy).toHaveBeenCalledWith(['/videos', 1]);
    });
  });
});
