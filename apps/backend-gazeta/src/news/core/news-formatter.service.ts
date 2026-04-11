import { Injectable } from '@nestjs/common';
import { NewsResponseDto } from '../dto/news-response.dto';

@Injectable()
export class NewsFormatterService {
  /**
   * Formata uma notícia do Prisma para o DTO de resposta
   */
  formatNewsResponse(news: any): NewsResponseDto {
    return {
      id: news.id,
      title: news.title,
      subtitle: news.subtitle,
      content: news.content,
      categoryId: news.newsCategories?.map((nc: any) => nc.categoryId) || [],
      author: news.author,
      mediaNews: news.mediaNews && news.mediaNews.length > 0
        ? news.mediaNews.map((media: any) => {
            // Parse imgSize se for string JSON
            let imgSize = media.imgSize;
            if (typeof imgSize === 'string' && imgSize) {
              try {
                imgSize = JSON.parse(imgSize);
                // Normalizar URLs (substituir backslashes por forward slashes)
                if (imgSize && typeof imgSize === 'object') {
                  Object.keys(imgSize).forEach(key => {
                    if (typeof imgSize[key] === 'string') {
                      imgSize[key] = imgSize[key].replace(/\\/g, '/');
                    }
                  });
                }
              } catch (error) {
                console.warn(`Erro ao fazer parse de imgSize para mídia ${media.id}:`, error);
                imgSize = null;
              }
            } else if (imgSize && typeof imgSize === 'object') {
              // Se já é objeto, normalizar URLs também
              Object.keys(imgSize).forEach(key => {
                if (typeof imgSize[key] === 'string') {
                  imgSize[key] = imgSize[key].replace(/\\/g, '/');
                }
              });
            }

            return {
              id: media.id,
              emphasis: media.emphasis,
              imgSize: imgSize,
              author: media.author,
              date: media.date
            };
          })
        : [],
      videoNews: news.videoNews && news.videoNews.length > 0
        ? news.videoNews.map((video: any) => ({
            id: video.id,
            url: video.url,
            thumbnail: video.thumbnail
          }))
        : [],
      published: news.published,
      createdAt: news.createdAt ? new Date(news.createdAt).toISOString() : new Date().toISOString(),
      updateAt: news.updateAt ? new Date(news.updateAt).toISOString() : new Date().toISOString(),
      views: news.views,
      status: news.status,
      validity: news.validity,
      slug: news.slug,
      isEmphasis: news.isEmphasis
    };
  }

  /**
   * Formata uma notícia incluindo tags (nomes das categorias)
   */
  formatNewsResponseWithTags(news: any): NewsResponseDto {
    const baseResponse = this.formatNewsResponse(news);
    
    // Adiciona os nomes das categorias como tags
    const tags = news.newsCategories
      ?.map((nc: any) => nc.category?.name)
      .filter((name: string) => name !== undefined && name !== null) || [];
    
    return {
      ...baseResponse,
      tags: tags.length > 0 ? tags : undefined
    };
  }

  /**
   * Formata múltiplas notícias
   */
  formatManyNewsResponse(newsArray: any[], includeTags = false): NewsResponseDto[] {
    return newsArray.map(news => 
      includeTags ? this.formatNewsResponseWithTags(news) : this.formatNewsResponse(news)
    );
  }
}

