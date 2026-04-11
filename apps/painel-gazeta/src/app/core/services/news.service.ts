import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../env/env';
import { News, NewsMedia, NewsVideo, PaginatedResponse, PaginationParams } from '@site-gazeta/models';
import { toHttpParams } from '@site-gazeta/api';
import { Observable, tap, switchMap, map } from 'rxjs';

// Interfaces locais removidas em favor do @site-gazeta/models

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/news`;

  /**
   * Criar nova notícia
   */
  create(body: News): Observable<News> {
    return this.http.post<News>(this.apiUrl, body);
  }

  /**
   * Listar notícias com filtros opcionais (Paginaçao)
   */
  getAll(params?: PaginationParams): Observable<PaginatedResponse<News>> {
    let url = this.apiUrl;

    if (params?.search) {
      url = `${this.apiUrl}/search`;
    }

    const httpParams = toHttpParams(params);
    return this.http.get<PaginatedResponse<News>>(url, { params: httpParams });
  }

  /**
   * Buscar notícias por termo (Paginado)
   */
  search(searchTerm: string, params?: PaginationParams): Observable<PaginatedResponse<News>> {
    return this.getAll({ ...params, search: searchTerm });
  }

  /**
   * Buscar notícia por ID
   */
  getById(id: number): Observable<News> {
    return this.http.get<News>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar notícia por slug
   */
  getBySlug(slug: string): Observable<News> {
    return this.http.get<News>(`${this.apiUrl}/slug/${slug}`);
  }

  /**
   * Atualizar notícia
   */
  update(id: number, body: Partial<News>): Observable<News> {
    console.log(id, body)
    return this.http.patch<News>(`${this.apiUrl}/${id}`, body);
  }

  /**
   * Atualizar status da notícia
   */
  updateStatus(id: number, status: string): Observable<News> {
    return this.http.patch<News>(`${this.apiUrl}/${id}/status`, { status });
  }

  /**
   * Deletar notícia
   */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // ========== MEDIA ==========

  /**
   * Upload de mídia para notícia
   */
  uploadMedia(body: FormData): Observable<NewsMedia> {
    return this.http.post<NewsMedia>(`${environment.apiUrl}/media/upload`, body);
  }

  /**
   * Atualizar mídia
   */
  updateMedia(id: number, body: Partial<NewsMedia>): Observable<NewsMedia> {
    return this.http.patch<NewsMedia>(`${environment.apiUrl}/media/${id}`, body);
  }

  /**
   * Deletar mídia
   */
  deleteMedia(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/media/${id}`);
  }

  /**
   * Limpar mídias duplicadas de uma notícia
   */
  cleanupDuplicateMedia(postId: number): Observable<{
    message: string;
    postId: number;
    deletedCount: number;
    keptMediaIds: number[];
    removedMediaIds: number[];
  }> {
    return this.http.post<{
      message: string;
      postId: number;
      deletedCount: number;
      keptMediaIds: number[];
      removedMediaIds: number[];
    }>(`${environment.apiUrl}/media/cleanup/by-post/${postId}`, {});
  }

  // ========== VIDEO ==========

  /**
   * Adicionar vídeo à notícia
   */
  addVideo(body: FormData): Observable<NewsVideo> {
    return this.http.post<NewsVideo>(`${environment.apiUrl}/news-videos`, body);
  }

  /**
   * Atualizar vídeo
   */
  updateVideo(id: number, body: Partial<NewsVideo>): Observable<NewsVideo> {
    return this.http.patch<NewsVideo>(`${environment.apiUrl}/news-videos/${id}`, body);
  }

  /**
   * Deletar vídeo
   */
  deleteVideo(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/news-videos/${id}`);
  }

  /**
   * Listar notícias em destaque
   */
  getFeatured(): Observable<News[]> {
    return this.http.get<News[]>(`${this.apiUrl}/featured`);
  }

  /**
   * Atualizar destaque da notícia com limite de 6
   * Se tentar marcar uma 7ª notícia como destaque, remove o destaque da mais antiga
   */
  updateEmphasis(newsId: number, isEmphasis: boolean): Observable<{ updatedNews: News; removedEmphasis?: News }> {
    // Se está removendo destaque, apenas atualiza
    if (!isEmphasis) {
      return this.update(newsId, { isEmphasis: false }).pipe(
        map(updatedNews => ({ updatedNews })),
        tap(result => {
          console.log('Destaque removido da notícia:', result.updatedNews.id);
        })
      );
    }

    // Se está adicionando destaque, primeiro verifica quantos já existem
    // Usamos o endpoint de destaques para ter a lista completa deles (limite de 6)
    return this.getFeatured().pipe(
      tap((featured: News[]) => {
        console.log('Destaques atuais:', featured.length);
      }),
      // Se já tem 6 ou mais, remove o mais antigo
      switchMap((featured: News[]) => {
        if (featured.length >= 6) {
          // Encontra a notícia mais antiga com destaque
          const oldestEmphasis = featured.reduce((oldest: News, current: News) => {
            const oldestDate = new Date(oldest.published || oldest.createdAt).getTime();
            const currentDate = new Date(current.published || current.createdAt).getTime();
            return currentDate < oldestDate ? current : oldest;
          });

          console.log('Removendo destaque da notícia mais antiga:', oldestEmphasis.id);

          // Remove o destaque da mais antiga
          return this.update(oldestEmphasis.id, { isEmphasis: false }).pipe(
            switchMap(() => {
              // Adiciona destaque à nova notícia
              return this.update(newsId, { isEmphasis: true });
            }),
            map((updatedNews: News) => ({
              updatedNews,
              removedEmphasis: oldestEmphasis
            }))
          );
        } else {
          // Ainda tem espaço, apenas adiciona o destaque
          return this.update(newsId, { isEmphasis: true }).pipe(
            map((updatedNews: News) => ({
              updatedNews
            }))
          );
        }
      })
    );
  }
}

