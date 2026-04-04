import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { UpdateNewsStatusDto } from './dto/update-news-status.dto';
import { NewsQueryDto } from './dto/news-query.dto';
import { NewsStatus } from './dto/news-status.enum';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async create(createNewsDto: CreateNewsDto, authorId: number): Promise<NewsResponseDto> {
    try {
      console.log('=== CREATE NEWS - Author ID:', authorId);

      // Verificar se já existe notícia com esse slug
      const existingNews = await this.prisma.news.findFirst({
        where: { slug: createNewsDto.slug }
      });

      if (existingNews) {
        throw new ConflictException('Já existe uma notícia com este slug');
      }

      // Verificar se as categorias existem
      const categories = await this.prisma.category.findMany({
        where: {
          id: { in: createNewsDto.categoryId },
          isActive: true
        }
      });

      if (categories.length !== createNewsDto.categoryId.length) {
        throw new NotFoundException('Uma ou mais categorias não foram encontradas');
      }

      // Extrair categoryId, mediaNews e videoNews do DTO
      const { categoryId, mediaNews, videoNews, ...newsData } = createNewsDto;

      // Criar a notícia com relacionamentos
      const news = await this.prisma.news.create({
        data: {
          ...newsData,
          status: createNewsDto.status || NewsStatus.ACTIVE,
          authorId,
          newsCategories: {
            create: categoryId.map(catId => ({ categoryId: catId }))
          },
          mediaNews: mediaNews ? {
            create: mediaNews.map(media => ({
              emphasis: media.emphasis ?? false,
              imgSize: media.imgSize,
              author: media.author,
              date: media.date
            }))
          } : undefined,
          videoNews: videoNews ? {
            create: videoNews.map(video => ({
              url: video.url,
              thumbnail: video.thumbnail
            }))
          } : undefined
        },
        include: {
          newsCategories: {
            include: {
              category: true
            }
          },
          mediaNews: true,
          videoNews: true
        }
      });

      console.log('=== NOTÍCIA CRIADA COM SUCESSO - ID:', news.id);
      return this.formatNewsResponse(news);
    } catch (error) {
      console.error('=== ERRO CREATE NEWS:', error.message);
      throw error;
    }
  }

  async findAll(query?: NewsQueryDto): Promise<NewsResponseDto[]> {
    const whereCondition: any = {};
    
    // Se não incluir trash, filtrar apenas ACTIVE e INACTIVE
    if (!query?.includeTrash) {
      whereCondition.status = {
        in: [NewsStatus.ACTIVE, NewsStatus.INACTIVE]
      };
    }
    
    // Se um status específico foi fornecido, usar ele
    if (query?.status) {
      whereCondition.status = query.status;
    }
    
    // Se nenhum filtro foi aplicado, mostrar apenas ACTIVE por padrão
    if (!query?.status && !query?.includeTrash) {
      whereCondition.status = NewsStatus.ACTIVE;
    }

    // Filtrar por categoria(s) se fornecido
    if (query?.categoryId && query.categoryId.length > 0) {
      whereCondition.newsCategories = {
        some: {
          categoryId: {
            in: query.categoryId
          }
        }
      };
    }

    // Filtrar por notícias em destaque se fornecido
    if (query?.isEmphasis !== undefined) {
      whereCondition.isEmphasis = query.isEmphasis;
    }

    const news = await this.prisma.news.findMany({
      where: whereCondition,
      include: {
        newsCategories: {
          include: {
            category: true
          }
        },
        mediaNews: true,
        videoNews: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return news.map(this.formatNewsResponse);
  }

  async findOne(id: number): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findFirst({
      where: { id },
      include: {
        newsCategories: {
          include: {
            category: true
          }
        },
        mediaNews: true,
        videoNews: true
      }
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    return this.formatNewsResponse(news);
  }

  async findBySlug(slug: string): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findFirst({
      where: { slug },
      include: {
        newsCategories: {
          include: {
            category: true
          }
        },
        mediaNews: true,
        videoNews: true
      }
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    return this.formatNewsResponse(news);
  }

  async update(id: number, updateNewsDto: UpdateNewsDto): Promise<NewsResponseDto> {
    // Verificar se a notícia existe
    const existingNews = await this.prisma.news.findFirst({
      where: { id }
    });

    if (!existingNews) {
      throw new NotFoundException('Notícia não encontrada');
    }

    // Verificar conflito de slug se foi fornecido
    if (updateNewsDto.slug && updateNewsDto.slug !== existingNews.slug) {
      const conflictNews = await this.prisma.news.findFirst({
        where: { slug: updateNewsDto.slug, id: { not: id } }
      });

      if (conflictNews) {
        throw new ConflictException('Já existe uma notícia com este slug');
      }
    }

    // Verificar categorias se foram fornecidas
    if (updateNewsDto.categoryId) {
      const categories = await this.prisma.category.findMany({
        where: {
          id: { in: updateNewsDto.categoryId },
          isActive: true
        }
      });

      if (categories.length !== updateNewsDto.categoryId.length) {
        throw new NotFoundException('Uma ou mais categorias não foram encontradas');
      }
    }

    const { categoryId, mediaNews, videoNews, ...newsData } = updateNewsDto;

    // Atualizar a notícia
    const updatedNews = await this.prisma.$transaction(async (tx) => {
      // Atualizar dados da notícia
      const news = await tx.news.update({
        where: { id },
        data: newsData
      });

      // Atualizar categorias se fornecidas
      if (categoryId) {
        await tx.newsCategory.deleteMany({
          where: { newsId: id }
        });

        await tx.newsCategory.createMany({
          data: categoryId.map(catId => ({ newsId: id, categoryId: catId }))
        });
      }

      // Atualizar mídias se fornecidas
      if (mediaNews) {
        await tx.newsMedia.deleteMany({
          where: { newsId: id }
        });

        await tx.newsMedia.createMany({
          data: mediaNews.map(media => ({
            newsId: id,
            emphasis: media.emphasis ?? false,
            imgSize: media.imgSize ? media.imgSize as any : null,
            author: media.author,
            date: media.date
          }))
        });
      }

      // Atualizar vídeos se fornecidos
      if (videoNews) {
        await tx.newsVideo.deleteMany({
          where: { newsId: id }
        });

        await tx.newsVideo.createMany({
          data: videoNews.map(video => ({
            newsId: id,
            url: video.url,
            thumbnail: video.thumbnail
          }))
        });
      }

      // Buscar a notícia atualizada com relacionamentos
      return await tx.news.findFirst({
        where: { id },
        include: {
          newsCategories: {
            include: {
              category: true
            }
          },
          mediaNews: true,
          videoNews: true
        }
      });
    });

    return this.formatNewsResponse(updatedNews);
  }

  async remove(id: number): Promise<void> {
    const news = await this.prisma.news.findFirst({
      where: { id }
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    await this.prisma.news.delete({
      where: { id }
    });
  }

  async updateStatus(id: number, updateStatusDto: UpdateNewsStatusDto): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findFirst({
      where: { id }
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    const updatedNews = await this.prisma.news.update({
      where: { id },
      data: { status: updateStatusDto.status },
      include: {
        newsCategories: {
          include: {
            category: true
          }
        },
        mediaNews: true,
        videoNews: true
      }
    });

    return this.formatNewsResponse(updatedNews);
  }

  async activate(id: number): Promise<NewsResponseDto> {
    return this.updateStatus(id, { status: NewsStatus.ACTIVE });
  }

  async deactivate(id: number): Promise<NewsResponseDto> {
    return this.updateStatus(id, { status: NewsStatus.INACTIVE });
  }

  async moveToTrash(id: number): Promise<NewsResponseDto> {
    return this.updateStatus(id, { status: NewsStatus.TRASH });
  }

  async restore(id: number): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findFirst({
      where: { id, status: NewsStatus.TRASH }
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada no lixo');
    }

    return this.updateStatus(id, { status: NewsStatus.ACTIVE });
  }

  async findTrash(): Promise<NewsResponseDto[]> {
    const news = await this.prisma.news.findMany({
      where: { status: NewsStatus.TRASH },
      include: {
        newsCategories: {
          include: {
            category: true
          }
        },
        mediaNews: true,
        videoNews: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return news.map(this.formatNewsResponse);
  }

  async permanentDelete(id: number): Promise<void> {
    const news = await this.prisma.news.findFirst({
      where: { id, status: NewsStatus.TRASH }
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada no lixo');
    }

    await this.prisma.news.delete({
      where: { id }
    });
  }

  async incrementView(id: number): Promise<number> {
    const news = await this.prisma.news.update({
      where: { id, published: 'true' },
      data: { views: { increment: 1 } },
      select: { views: true }
    });

    return news.views;
  }

  async search(searchTerm: string, limit = 50): Promise<NewsResponseDto[]> {
    // Normalizar termo de busca (remover espaços extras)
    const normalizedSearch = searchTerm.trim();

    const news = await this.prisma.news.findMany({
      where: {
        AND: [
          // Apenas notícias ativas
          { status: NewsStatus.ACTIVE },
          // Buscar em título, subtítulo ou nome da categoria
          {
            OR: [
              {
                title: {
                  contains: normalizedSearch
                }
              },
              {
                subtitle: {
                  contains: normalizedSearch
                }
              },
              {
                newsCategories: {
                  some: {
                    category: {
                      name: {
                        contains: normalizedSearch
                      }
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        newsCategories: {
          include: {
            category: true
          }
        },
        mediaNews: true,
        videoNews: true
      },
      orderBy: [
        { isEmphasis: 'desc' }, // Notícias em destaque primeiro
        { views: 'desc' },      // Depois por views
        { createdAt: 'desc' }   // E por data
      ],
      take: limit
    });

    return news.map(this.formatNewsResponse);
  }

  async findFeatured(): Promise<NewsResponseDto[]> {
    const news = await this.prisma.news.findMany({
      where: {
        status: NewsStatus.ACTIVE,
        isEmphasis: true
      },
      include: {
        newsCategories: {
          include: {
            category: true
          }
        },
        mediaNews: true,
        videoNews: true
      },
      orderBy: [
        { createdAt: 'desc' },  // Por data de criação (mais recente primeiro)
        { views: 'desc' }        // E por views como critério de desempate
      ]
    });

    return news.map(newsItem => this.formatNewsResponseWithTags(newsItem));
  }

  private formatNewsResponse(news: any): NewsResponseDto {
    return {
      id: news.id,
      title: news.title,
      subtitle: news.subtitle,
      content: news.content,
      categoryId: news.newsCategories.map(nc => nc.categoryId),
      author: news.author,
      mediaNews: news.mediaNews && news.mediaNews.length > 0 
        ? news.mediaNews.map(media => ({
            id: media.id,
            emphasis: media.emphasis,
            imgSize: media.imgSize,
            author: media.author,
            date: media.date
          }))
        : [], // Array vazio ao invés de null
      videoNews: news.videoNews && news.videoNews.length > 0 
        ? news.videoNews.map(video => ({
            id: video.id,
            url: video.url,
            thumbnail: video.thumbnail
          }))
        : [], // Array vazio ao invés de null
      published: news.published,
      createdAt: news.createdAt.toISOString(),
      updateAt: news.updateAt.toISOString(),
      views: news.views,
      status: news.status,
      validity: news.validity,
      slug: news.slug,
      isEmphasis: news.isEmphasis
    };
  }

  private formatNewsResponseWithTags(news: any): NewsResponseDto {
    const baseResponse = this.formatNewsResponse(news);
    
    // Adiciona os nomes das categorias como tags
    const tags = news.newsCategories
      .map(nc => nc.category?.name)
      .filter(name => name !== undefined && name !== null);
    
    return {
      ...baseResponse,
      tags: tags.length > 0 ? tags : undefined
    };
  }
} 