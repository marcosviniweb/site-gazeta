import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsResponseDto } from '../dto/news-response.dto';
import { NewsQueryDto } from '../dto/news-query.dto';
import { NewsStatus } from '../dto/news-status.enum';
import { NewsFormatterService } from '../core/news-formatter.service';
import { Prisma } from '../../../generated/prisma';

export interface NewsPaginatedMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface NewsPaginatedResponse {
  data: NewsResponseDto[];
  meta: NewsPaginatedMeta;
}

@Injectable()
export class NewsQueryService {
  constructor(
    private prisma: PrismaService,
    private formatter: NewsFormatterService
  ) {}

  /**
   * Seletor de campos para listagens (Otimizado - Sem o campo 'content')
   */
  private getNewsListSelect() {
    return {
      id: true,
      title: true,
      subtitle: true,
      slug: true,
      status: true,
      published: true,
      views: true,
      author: true,
      isEmphasis: true,
      createdAt: true,
      updateAt: true,
      newsCategories: {
        include: {
          category: true
        }
      },
      mediaNews: true,
      videoNews: true
    };
  }

  /**
   * Inclui padrão para queries de detalhes (Completo)
   */
  private getNewsInclude() {
    return {
      newsCategories: {
        include: {
          category: true
        }
      },
      mediaNews: true,
      videoNews: true
    };
  }

  /**
   * Converte string de IDs para array de números
   */
  private parseExcludeIds(exclude?: string): number[] {
    if (!exclude) return [];

    return exclude
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));
  }

  /**
   * Constrói condições WHERE para queries
   */
  private buildWhereCondition(query?: NewsQueryDto): Prisma.NewsWhereInput {
    const whereCondition: Prisma.NewsWhereInput = {};

    // Filtro de status: status específico tem prioridade sobre includeTrash
    if (query?.status) {
      // Se um status específico foi fornecido, usar ele
      whereCondition.status = query.status;
    } else if (query?.includeTrash) {
      // Se includeTrash=true mas não há status específico, não filtrar por status (inclui tudo)
      // Não adiciona filtro de status - mostra todos os status (ACTIVE, INACTIVE, TRASH)
    } else {
      // Padrão: apenas ACTIVE se nenhum filtro foi aplicado
      whereCondition.status = NewsStatus.ACTIVE;
    }

    // Filtro de exclusão de IDs
    if (query?.exclude) {
      const excludeIds = query.exclude
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id));

      if (excludeIds.length > 0) {
        whereCondition.id = { notIn: excludeIds };
      }
    }

    // Novos Filtros Server-Side Paginados
    if (query?.categoryId) {
      whereCondition.newsCategories = {
        some: {
          categoryId: query.categoryId
        }
      };
    }

    if (query?.isEmphasis !== undefined) {
      whereCondition.isEmphasis = query.isEmphasis;
    }

    if (query?.date) {
      // Formato YYYY-MM-DD
      const dateStr = query.date;
      whereCondition.createdAt = {
        gte: new Date(`${dateStr}T00:00:00.000Z`),
        lte: new Date(`${dateStr}T23:59:59.999Z`)
      };
    } else if (query?.year) {
      // Filtro por Ano e opcionalmente Mês
      const year = query.year;
      const month = query.month; // 1-12

      if (month) {
        // Mês específico do ano
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        whereCondition.createdAt = {
          gte: startDate,
          lte: endDate
        };
      } else {
        // Ano inteiro
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        whereCondition.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }
    }

    return whereCondition;
  }

  /**
   * Constrói array dinâmico de ordenação
   */
  private buildOrderByCondition(query?: NewsQueryDto, defaultEmphasisFirst = false): Prisma.NewsOrderByWithRelationInput[] {
    const orderBy: Prisma.NewsOrderByWithRelationInput[] = [];

    if (query?.views) {
      orderBy.push({ views: query.views });
    }
    
    if (query?.order) {
      orderBy.push({ createdAt: query.order });
    }

    // Padrões se nenhum método de order foi provido
    if (orderBy.length === 0) {
      if (defaultEmphasisFirst) {
        orderBy.push({ isEmphasis: 'desc' });
      }
      orderBy.push({ createdAt: 'desc' });
    }

    return orderBy;
  }

  /**
   * Lista todas as notícias com paginação e filtros
   */
  async findAll(query?: NewsQueryDto): Promise<NewsPaginatedResponse> {
    const whereCondition = this.buildWhereCondition(query);
    const orderBy = this.buildOrderByCondition(query, false);
    const page = query?.page || 1;
    const limit = query?.limit || 25;
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where: whereCondition,
        select: this.getNewsListSelect(),
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.news.count({ where: whereCondition })
    ]);

    return {
      data: this.formatter.formatManyNewsResponse(news),
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Busca notícias por termo de busca com paginação e filtros
   */
  async search(query: NewsQueryDto & { search: string }): Promise<NewsPaginatedResponse> {
    const searchTerm = query.search.trim();
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    // Filtros de busca
    const searchCondition = {
      OR: [
        { title: { contains: searchTerm } },
        { subtitle: { contains: searchTerm } },
        {
          newsCategories: {
            some: {
              category: {
                name: { contains: searchTerm }
              }
            }
          }
        }
      ]
    };

    // Filtros de status (reutilizando a lógica do buildWhereCondition)
    const whereCondition = this.buildWhereCondition(query);
    
    // Combina busca com status
    const combinedWhere = {
      AND: [
        whereCondition,
        searchCondition
      ]
    };
    
    const orderBy = this.buildOrderByCondition(query, true);

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where: combinedWhere,
        select: this.getNewsListSelect(),
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.news.count({ where: combinedWhere })
    ]);

    return {
      data: this.formatter.formatManyNewsResponse(news),
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  async findFeatured(exclude?: string): Promise<NewsResponseDto[]> {
    const excludeIds = this.parseExcludeIds(exclude);

    const whereCondition: Prisma.NewsWhereInput = {
      status: NewsStatus.ACTIVE,
      isEmphasis: true
    };

    if (excludeIds.length > 0) {
      whereCondition.id = { notIn: excludeIds };
    }

    const news = await this.prisma.news.findMany({
      where: whereCondition,
      select: this.getNewsListSelect(),
      orderBy: [
        { views: 'desc' },      // Por views
        { createdAt: 'desc' }   // E por data
      ]
    });

    return this.formatter.formatManyNewsResponse(news, true);
  }

  /**
   * Busca últimas notícias recentes
   * NOTA: Este endpoint é uma exceção e NÃO filtra IDs excluídos.
   * Sempre retorna as notícias mais recentes, mesmo que já tenham sido exibidas.
   */
  async findLatestNews(exclude?: string, limit = 5): Promise<NewsResponseDto[]> {
    const news = await this.prisma.news.findMany({
      where: {
        status: NewsStatus.ACTIVE
      },
      select: this.getNewsListSelect(),
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return this.formatter.formatManyNewsResponse(news, true);
  }

  /**
   * Busca notícias mais vistas dos últimos 7 dias
   * Se não houver notícias suficientes, busca da semana anterior e assim sucessivamente
   * @throws NotFoundException se não houver notícias cadastradas
   */
  async findMostViewed(): Promise<NewsResponseDto[]> {
    const targetCount = 9;
    const maxWeeksBack = 52; // Limite de 1 ano
    const collectedNews: NewsResponseDto[] = [];

    for (let week = 0; week < maxWeeksBack && collectedNews.length < targetCount; week++) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (7 * week));

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (7 * (week + 1)));

      // Buscar notícias publicadas nesta semana
      const weekNews = await this.prisma.news.findMany({
        where: {
          status: NewsStatus.ACTIVE,
          AND: [
            { published: { not: 'false' } },
            { published: { not: '' } },
            { published: { gte: startDate.toISOString() } },
            { published: { lte: endDate.toISOString() } }
          ]
        },
        select: this.getNewsListSelect(),
        orderBy: { views: 'desc' }
      });

      // Formatar notícias antes de adicionar à coleção
      const formattedWeekNews = this.formatter.formatManyNewsResponse(weekNews, true);

      // Adicionar notícias que ainda não foram coletadas
      for (const news of formattedWeekNews) {
        if (collectedNews.length >= targetCount) break;
        if (!collectedNews.some(n => n.id === news.id)) {
          collectedNews.push(news);
        }
      }
    }

    // Se não encontrou nenhuma notícia, lança erro
    if (collectedNews.length === 0) {
      throw new NotFoundException('Não há notícias cadastradas');
    }

    return this.formatter.formatManyNewsResponse(collectedNews, true);
  }

  /**
   * Busca notícias relacionadas baseadas nas categorias
   */
  async findRelatedNews(newsId: number): Promise<NewsResponseDto[]> {
    // Buscar a notícia atual
    const currentNews = await this.prisma.news.findFirst({
      where: { id: newsId },
      include: {
        newsCategories: true
      }
    });

    if (!currentNews) {
      throw new NotFoundException('Notícia não encontrada');
    }

    // Pegar os IDs das categorias da notícia atual
    const categoryIds = currentNews.newsCategories.map(nc => nc.categoryId);

    if (categoryIds.length === 0) {
      return [];
    }

    // Buscar notícias relacionadas por categoria
    const relatedNewsMap = new Map<number, NewsResponseDto>();

    // Para cada categoria, buscar 3 notícias aleatórias
    for (const categoryId of categoryIds) {
      const categoryNews = await this.prisma.news.findMany({
        where: {
          status: NewsStatus.ACTIVE,
          id: { not: newsId },
          newsCategories: {
            some: { categoryId: categoryId }
          }
        },
        select: this.getNewsListSelect()
      });

      // Embaralhar e pegar até 3 notícias
      const newsToTake = Math.min(categoryNews.length, 3);
      const shuffled = [...categoryNews].sort(() => Math.random() - 0.5);
      const selectedNews = shuffled.slice(0, newsToTake);

      // Adicionar ao mapa (evita duplicatas)
      selectedNews.forEach(newsItem => {
        if (!relatedNewsMap.has(newsItem.id)) {
          relatedNewsMap.set(
            newsItem.id,
            this.formatter.formatNewsResponseWithTags(newsItem)
          );
        }
      });
    }

    return Array.from(relatedNewsMap.values());
  }

  /**
   * Busca notícias por categoria específica
   */
  async findByCategory(categoryId: number, exclude?: string): Promise<NewsResponseDto[]> {
    const excludeIds = this.parseExcludeIds(exclude);

    const whereCondition: Prisma.NewsWhereInput = {
      status: NewsStatus.ACTIVE,
      newsCategories: {
        some: {
          categoryId: categoryId
        }
      }
    };

    if (excludeIds.length > 0) {
      whereCondition.id = { notIn: excludeIds };
    }

    const news = await this.prisma.news.findMany({
      where: whereCondition,
      select: this.getNewsListSelect(),
      orderBy: { createdAt: 'desc' }
    });

    return this.formatter.formatManyNewsResponse(news);
  }
}

