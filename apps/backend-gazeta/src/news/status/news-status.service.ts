import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsResponseDto } from '../dto/news-response.dto';
import { UpdateNewsStatusDto } from '../dto/update-news-status.dto';
import { NewsStatus } from '../dto/news-status.enum';
import { NewsFormatterService } from '../core/news-formatter.service';

@Injectable()
export class NewsStatusService {
  constructor(
    private prisma: PrismaService,
    private formatter: NewsFormatterService
  ) {}

  /**
   * Inclui padrão para queries de notícias
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
   * Atualiza o status de uma notícia
   */
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
      include: this.getNewsInclude()
    });

    return this.formatter.formatNewsResponse(updatedNews);
  }

  /**
   * Ativa uma notícia (status = ACTIVE)
   */
  async activate(id: number): Promise<NewsResponseDto> {
    return this.updateStatus(id, { status: NewsStatus.ACTIVE });
  }

  /**
   * Desativa uma notícia (status = INACTIVE)
   */
  async deactivate(id: number): Promise<NewsResponseDto> {
    return this.updateStatus(id, { status: NewsStatus.INACTIVE });
  }

  /**
   * Move uma notícia para o lixo (status = TRASH)
   */
  async moveToTrash(id: number): Promise<NewsResponseDto> {
    return this.updateStatus(id, { status: NewsStatus.TRASH });
  }

  /**
   * Restaura uma notícia do lixo (status = ACTIVE)
   */
  async restore(id: number): Promise<NewsResponseDto> {
    const news = await this.prisma.news.findFirst({
      where: { id, status: NewsStatus.TRASH }
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada no lixo');
    }

    return this.updateStatus(id, { status: NewsStatus.ACTIVE });
  }

  /**
   * Busca todas as notícias no lixo
   */
  async findTrash(): Promise<NewsResponseDto[]> {
    const news = await this.prisma.news.findMany({
      where: { status: NewsStatus.TRASH },
      include: this.getNewsInclude(),
      orderBy: { createdAt: 'desc' }
    });

    return this.formatter.formatManyNewsResponse(news);
  }

  /**
   * Exclui permanentemente uma notícia do lixo
   */
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

  /**
   * Atualiza o status de múltiplas notícias (Bulk)
   */
  async bulkUpdateStatus(ids: number[], status: NewsStatus): Promise<{ count: number }> {
    const result = await this.prisma.news.updateMany({
      where: {
        id: { in: ids }
      },
      data: { status }
    });

    return { count: result.count };
  }
}

