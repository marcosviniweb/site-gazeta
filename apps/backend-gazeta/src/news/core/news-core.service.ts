import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNewsDto } from '../dto/create-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';
import { NewsResponseDto } from '../dto/news-response.dto';
import { NewsStatus } from '../dto/news-status.enum';
import { NewsFormatterService } from './news-formatter.service';
import { ContentMediaService } from '../../content-media/content-media.service';
import { ImageProcessingService, ImageSizes } from '../../media/services/image-processing.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);

@Injectable()
export class NewsCoreService {
  private readonly logger = new Logger(NewsCoreService.name);

  constructor(
    private prisma: PrismaService,
    private formatter: NewsFormatterService,
    private contentMediaService: ContentMediaService,
    private imageProcessingService: ImageProcessingService
  ) {}

  /**
   * Seletor de campos para detalhes (Completo - Com o campo 'content')
   */
  private getNewsDetailSelect() {
    return {
      id: true,
      title: true,
      subtitle: true,
      content: true,
      slug: true,
      status: true,
      published: true,
      views: true,
      author: true,
      isEmphasis: true,
      validity: true,
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
   * Inclui padrão para queries de notícias
   * @deprecated Use getNewsDetailSelect para consultas que requerem payload específico
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
   * Valida se o slug já existe
   */
  async validateSlug(slug: string, excludeId?: number): Promise<void> {
    const where: { slug: string; id?: { not: number } } = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existingNews = await this.prisma.news.findFirst({ where });

    if (existingNews) {
      throw new ConflictException('Já existe uma notícia com este slug');
    }
  }

  /**
   * Valida se as categorias existem e estão ativas
   */
  async validateCategories(categoryIds: number[]): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true
      }
    });

    if (categories.length !== categoryIds.length) {
      throw new NotFoundException('Uma ou mais categorias não foram encontradas');
    }
  }

  /**
   * Cria uma nova notícia
   */
  async create(createNewsDto: CreateNewsDto, authorId: number): Promise<NewsResponseDto> {
    console.log('=== CREATE NEWS - Author ID:', authorId);

    // Validar slug único
    await this.validateSlug(createNewsDto.slug);

    // Validar categorias
    await this.validateCategories(createNewsDto.categoryId);

    // Extrair dados relacionados
    const { categoryId, mediaNews, videoNews, ...newsData } = createNewsDto;
    let reconciledMediaNews = mediaNews?.filter(m => m.imgSize);

    // Garantir que apenas uma mídia tenha emphasis: true (exclusividade)
    if (reconciledMediaNews && reconciledMediaNews.length > 0) {
      const featuredIndex = reconciledMediaNews.findIndex(m => m.emphasis === true);
      if (featuredIndex !== -1) {
        reconciledMediaNews = reconciledMediaNews.map((m, index) => ({
          ...m,
          emphasis: index === featuredIndex
        }));
      }
    }

    // Criar a notícia com relacionamentos
    const news = await this.prisma.news.create({
      data: {
        ...newsData,
        status: createNewsDto.status || NewsStatus.ACTIVE,
        authorId,
        newsCategories: {
          create: categoryId.map(catId => ({ categoryId: catId }))
        },
        mediaNews: reconciledMediaNews && reconciledMediaNews.length > 0 ? {
          create: reconciledMediaNews.map(media => ({
            emphasis: media.emphasis ?? false,
            imgSize: typeof media.imgSize === 'string' ? media.imgSize : JSON.stringify(Array.isArray(media.imgSize) ? media.imgSize[0] : media.imgSize),
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
      include: this.getNewsInclude()
    });

    // Se a notícia foi criada como destaque, tratar o limite
    let removedEmphasis = null;
    if (news.isEmphasis) {
      removedEmphasis = await this.prisma.$transaction(async (tx) => {
        return await this.handleEmphasisLimit(tx, news.id);
      });
    }

    console.log('=== NOTÍCIA CRIADA COM SUCESSO - ID:', news.id);
    
    // Sincronizar referências de ContentMedia
    if (createNewsDto.content) {
      await this.contentMediaService.syncNewsContentMedia(news.id, createNewsDto.content);
    }
    
    // Buscar notícia atualizada com todas as relações
    const updatedNews = await this.prisma.news.findFirst({
      where: { id: news.id },
      include: this.getNewsInclude()
    });
    
    return this.formatter.formatNewsResponse(updatedNews);
  }

  /**
   * Busca uma notícia por ID
   */
  async findOne(id: number): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findFirst({
      where: { id },
      select: this.getNewsDetailSelect()
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    return this.formatter.formatNewsResponse(news);
  }

  /**
   * Busca uma notícia por slug
   */
  async findBySlug(slug: string): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findFirst({
      where: { slug },
      select: this.getNewsDetailSelect()
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    return this.formatter.formatNewsResponse(news);
  }

  /**
   * Atualiza uma notícia existente
   */
  async update(id: number, updateNewsDto: UpdateNewsDto): Promise<NewsResponseDto> {
    // Verificar se a notícia existe
    const existingNews = await this.prisma.news.findFirst({
      where: { id }
    });

    if (!existingNews) {
      throw new NotFoundException('Notícia não encontrada');
    }

    // Validar slug único se foi alterado
    if (updateNewsDto.slug && updateNewsDto.slug !== existingNews.slug) {
      await this.validateSlug(updateNewsDto.slug, id);
    }

    // Validar categorias se foram fornecidas
    if (updateNewsDto.categoryId) {
      await this.validateCategories(updateNewsDto.categoryId);
    }

    const { categoryId, mediaNews, videoNews, ...newsData } = updateNewsDto;
    let reconciledMediaNews = mediaNews?.filter(m => m.imgSize);

    // Garantir que apenas uma mídia tenha emphasis: true (exclusividade)
    if (reconciledMediaNews && reconciledMediaNews.length > 0) {
      const featuredIndex = reconciledMediaNews.findIndex(m => m.emphasis === true);
      if (featuredIndex !== -1) {
        reconciledMediaNews = reconciledMediaNews.map((m, index) => ({
          ...m,
          emphasis: index === featuredIndex
        }));
      }
    }

    // Atualizar a notícia em transação
    await this.prisma.$transaction(async (tx) => {
      // Se está ativando o destaque, tratar o limite
      let removedEmphasis = null;
      if (newsData.isEmphasis === true && !existingNews.isEmphasis) {
        removedEmphasis = await this.handleEmphasisLimit(tx, id);
      }

      // Atualizar dados da notícia
      await tx.news.update({
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
      if (reconciledMediaNews) {
        await tx.newsMedia.deleteMany({
          where: { newsId: id }
        });

        if (reconciledMediaNews.length > 0) {
          await tx.newsMedia.createMany({
            data: reconciledMediaNews.map(media => ({
              newsId: id,
              emphasis: media.emphasis ?? false,
              imgSize: typeof media.imgSize === 'string' ? media.imgSize : JSON.stringify(Array.isArray(media.imgSize) ? media.imgSize[0] : media.imgSize),
              author: media.author,
              date: media.date
            }))
          });
        }
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
        include: this.getNewsInclude()
      });
    });

    // Sincronizar referências de ContentMedia após atualização
    if (updateNewsDto.content) {
      await this.contentMediaService.syncNewsContentMedia(id, updateNewsDto.content);
    }

    // Buscar notícia atualizada com todas as relações
    const finalNews = await this.prisma.news.findFirst({
      where: { id },
      include: this.getNewsInclude()
    });

    return this.formatter.formatNewsResponse(finalNews);
  }

  /**
   * Remove uma notícia permanentemente
   */
  async remove(id: number): Promise<void> {
    const news = await this.prisma.news.findFirst({
      where: { id },
      include: {
        mediaNews: true, // Incluir mídias para deletar arquivos físicos
        contentMedia: {
          include: {
            contentMedia: true
          }
        }
      }
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    // Deletar arquivos físicos das mídias antes de deletar a notícia
    const deletedTimestamps = new Set<string>();
    if (news.mediaNews && news.mediaNews.length > 0) {
      for (const media of news.mediaNews) {
        if (media.imgSize) {
          try {
            // Parse imgSize se for string JSON
            let imgSize: ImageSizes;
            if (typeof media.imgSize === 'string') {
              imgSize = JSON.parse(media.imgSize);
            } else {
              imgSize = media.imgSize as ImageSizes;
            }
            
            // Converter URLs para caminhos do sistema de arquivos
            const fileSystemPaths: ImageSizes = {
              original: this.urlToFilePath(imgSize.original),
              medium: this.urlToFilePath(imgSize.medium),
              small: this.urlToFilePath(imgSize.small),
              superSmall: this.urlToFilePath(imgSize.superSmall)
            };
            
            this.logger.log(`Deletando arquivos de mídia ${media.id}:`, fileSystemPaths);
            
            // Deletar arquivos físicos (original, medium, small, superSmall)
            await this.imageProcessingService.deleteImageFiles(fileSystemPaths);
            
            this.logger.log(`Arquivos de mídia ${media.id} deletados com sucesso`);
            
            // Extrair timestamp do caminho para deletar pasta depois
            const originalPath = fileSystemPaths.original;
            const timestampMatch = originalPath.match(/uploads[\\/](\d{13})/);
            if (timestampMatch) {
              deletedTimestamps.add(timestampMatch[1]);
            }
          } catch (error) {
            this.logger.error(`Erro ao deletar arquivos de mídia ${media.id}:`, error);
            // Continua mesmo se houver erro ao deletar arquivos
          }
        }
      }
      
      // Deletar pastas vazias após deletar todos os arquivos
      for (const timestamp of deletedTimestamps) {
        try {
          const timestampDir = path.join('uploads', timestamp);
          if (fs.existsSync(timestampDir)) {
            const files = await readdir(timestampDir);
            if (files.length === 0) {
              // Pasta vazia, deletar
              try {
                if (typeof fs.rm === 'function') {
                  await promisify(fs.rm)(timestampDir, { recursive: true, force: true });
                } else {
                  await promisify(fs.rmdir)(timestampDir);
                }
                this.logger.log(`Pasta vazia deletada: ${timestampDir}`);
              } catch (rmError: unknown) {
                const error = rmError as { code?: string; message?: string };
                if (error.code !== 'ENOTEMPTY' && error.code !== 'ENOENT') {
                  this.logger.warn(`Erro ao deletar pasta ${timestampDir}:`, error.message);
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Erro ao verificar/deletar pasta ${timestamp}:`, error);
          // Não interrompe a deleção da notícia
        }
      }
    }

    // Deletar notícia (Cascade remove NewsMedia, NewsVideo, NewsContentMedia automaticamente)
    await this.prisma.news.delete({
      where: { id }
    });

    // Limpar ContentMedia órfãos após deletar notícia
    // (arquivos que não estão mais referenciados por nenhuma notícia)
    await this.contentMediaService.cleanupOrphanedContentMedia();
  }

  /**
   * Atualiza o destaque de múltiplas notícias (Bulk)
   */
  async bulkUpdateEmphasis(ids: number[], isEmphasis: boolean): Promise<{ count: number }> {
    const result = await this.prisma.news.updateMany({
      where: {
        id: { in: ids }
      },
      data: { isEmphasis }
    });

    return { count: result.count };
  }

  /**
   * Remove múltiplas notícias permanentemente (Bulk)
   */
  async bulkRemove(ids: number[]): Promise<{ count: number }> {
    let count = 0;
    for (const id of ids) {
      try {
        await this.remove(id);
        count++;
      } catch (error) {
        this.logger.error(`Erro ao remover notícia ${id} em lote:`, error);
      }
    }
    return { count };
  }

  /**
   * Atualiza o destaque de uma notícia individualmente com controle de limite
   */
  async updateEmphasis(id: number, isEmphasis: boolean): Promise<any> {
    const news = await this.prisma.news.findUnique({ where: { id } });
    if (!news) throw new NotFoundException('Notícia não encontrada');

    let removedEmphasis = null;

    const updatedNews = await this.prisma.$transaction(async (tx) => {
      if (isEmphasis && !news.isEmphasis) {
        removedEmphasis = await this.handleEmphasisLimit(tx, id);
      }

      return await tx.news.update({
        where: { id },
        data: { isEmphasis },
        include: this.getNewsInclude()
      });
    });

    const response = this.formatter.formatNewsResponse(updatedNews);
    return { ...response, removedEmphasis };
  }

  /**
   * Garante que não haja mais de 6 notícias em destaque
   * Retorna a notícia que perdeu o destaque, se houver
   */
  private async handleEmphasisLimit(tx: any, currentNewsId: number): Promise<any | null> {
    const emphasisCount = await tx.news.count({
      where: { isEmphasis: true, status: NewsStatus.ACTIVE }
    });

    if (emphasisCount >= 6) {
      // Buscar a notícia mais antiga em destaque (exceto a atual)
      const oldestEmphasis = await tx.news.findFirst({
        where: { isEmphasis: true, id: { not: currentNewsId }, status: NewsStatus.ACTIVE },
        orderBy: { createdAt: 'asc' }
      });

      if (oldestEmphasis) {
        await tx.news.update({
          where: { id: oldestEmphasis.id },
          data: { isEmphasis: false }
        });
        return oldestEmphasis;
      }
    }
    return null;
  }

  /**
   * Converte URL para caminho do sistema de arquivos
   * Ex: "http://localhost:3002/uploads/1764615977961/imagem.webp" -> "uploads/1764615977961/imagem.webp"
   * Também decodifica URLs codificadas (ex: "Captura%20de%20Tela" -> "Captura de Tela")
   */
  private urlToFilePath(url: string): string {
    try {
      let filePath: string;
      
      // Se for URL completa, extrair o pathname
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        filePath = urlObj.pathname;
      } else {
        // Se já for caminho relativo, usar como está
        filePath = url;
      }
      
      // Remover barra inicial
      filePath = filePath.replace(/^\//, '');
      
      // Decodificar URL encoding (ex: %20 -> espaço, %28 -> (, etc)
      try {
        filePath = decodeURIComponent(filePath);
      } catch (error) {
        // Se falhar na decodificação, usar como está
        this.logger.warn(`Erro ao decodificar URL: ${url}`, error);
      }
      
      return filePath;
    } catch {
      // Se não for URL válida, assumir que já é um caminho e tentar decodificar
      try {
        return decodeURIComponent(url.replace(/^\/+/, ''));
      } catch {
        return url.replace(/^\/+/, '');
      }
    }
  }
}

