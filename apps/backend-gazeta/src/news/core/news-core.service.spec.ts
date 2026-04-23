import { Test, TestingModule } from '@nestjs/testing';
import { NewsCoreService } from './news-core.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsFormatterService } from './news-formatter.service';
import { ContentMediaService } from '../../content-media/content-media.service';
import { ImageProcessingService } from '../../media/services/image-processing.service';
import { NewsStatus } from '../dto/news-status.enum';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('NewsCoreService', () => {
  let service: NewsCoreService;
  let prisma: any;

  beforeEach(async () => {
    const prismaMock = {
      news: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
      newsCategory: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      newsMedia: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      newsVideo: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsCoreService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: NewsFormatterService,
          useValue: {
            formatNewsResponse: jest.fn((news) => news),
          },
        },
        {
          provide: ContentMediaService,
          useValue: {
            syncNewsContentMedia: jest.fn(),
            cleanupOrphanedContentMedia: jest.fn(),
          },
        },
        {
          provide: ImageProcessingService,
          useValue: {
            deleteImageFiles: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NewsCoreService>(NewsCoreService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleEmphasisLimit', () => {
    it('should remove emphasis from oldest news when limit is reached', async () => {
      // Configurar mock para count >= 6
      prisma.news.count.mockResolvedValue(6);
      
      const oldestNews = { id: 10, isEmphasis: true, status: NewsStatus.ACTIVE, createdAt: new Date() };
      
      // Quando for buscar a notícia mais antiga em destaque (exceto a atual)
      prisma.news.findFirst.mockResolvedValue(oldestNews);

      const result = await (service as any).handleEmphasisLimit(prisma, 99);

      expect(prisma.news.count).toHaveBeenCalledWith({
        where: { isEmphasis: true, status: NewsStatus.ACTIVE }
      });

      expect(prisma.news.findFirst).toHaveBeenCalledWith({
        where: { isEmphasis: true, id: { not: 99 }, status: NewsStatus.ACTIVE },
        orderBy: { createdAt: 'asc' }
      });

      expect(prisma.news.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { isEmphasis: false }
      });

      expect(result).toEqual(oldestNews);
    });

    it('should return null when limit is not reached', async () => {
      prisma.news.count.mockResolvedValue(5);

      const result = await (service as any).handleEmphasisLimit(prisma, 99);

      expect(prisma.news.findFirst).not.toHaveBeenCalled();
      expect(prisma.news.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('validateSlug', () => {
    it('should throw ConflictException if slug already exists', async () => {
      prisma.news.findFirst.mockResolvedValue({ id: 1, slug: 'test-slug' });

      await expect(service.validateSlug('test-slug')).rejects.toThrow(ConflictException);
    });

    it('should not throw if slug does not exist', async () => {
      prisma.news.findFirst.mockResolvedValue(null);

      await expect(service.validateSlug('test-slug')).resolves.not.toThrow();
    });
  });

  describe('validateCategories', () => {
    it('should throw NotFoundException if category is missing', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(service.validateCategories([1, 2])).rejects.toThrow(NotFoundException);
    });

    it('should not throw if all categories exist', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await expect(service.validateCategories([1, 2])).resolves.not.toThrow();
    });
  });
});
