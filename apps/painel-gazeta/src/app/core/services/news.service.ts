import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@site-gazeta/env';
import {
  News,
  NewsMedia,
  NewsVideo,
  PaginatedResponse,
  PaginationParams,
} from '@site-gazeta/models';
import { toHttpParams } from '@site-gazeta/api';
import { Observable, tap, switchMap, map } from 'rxjs';

// Interfaces locais removidas em favor do @site-gazeta/models

@Injectable({
  providedIn: 'root',
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
  search(
    searchTerm: string,
    params?: PaginationParams,
  ): Observable<PaginatedResponse<News>> {
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
    return this.http.patch<News>(`${this.apiUrl}/${id}`, body);
  }

  /**
   * Atualizar status da notícia
   */
  updateStatus(id: number, status: string): Observable<News> {
    return this.http.patch<News>(`${this.apiUrl}/${id}/status`, { status });
  }

  /**
   * Deletar notícia (Mover para lixeira)
   */
  delete(id: number): Observable<News> {
    return this.moveToTrash(id);
  }

  /**
   * Mover para lixeira
   */
  moveToTrash(id: number): Observable<News> {
    return this.http.patch<News>(`${this.apiUrl}/${id}/trash`, {});
  }

  /**
   * Restaurar notícia da lixeira
   */
  restore(id: number): Observable<News> {
    return this.http.patch<News>(`${this.apiUrl}/${id}/restore`, {});
  }

  /**
   * Listar notícias na lixeira
   */
  getTrash(): Observable<News[]> {
    return this.http.get<News[]>(`${this.apiUrl}/trash`);
  }

  /**
   * Excluir permanentemente
   */
  permanentDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/permanent`);
  }

  // ========== MEDIA ==========

  /**
   * Upload de mídia para notícia
   */
  uploadMedia(body: FormData): Observable<NewsMedia> {
    return this.http.post<NewsMedia>(
      `${environment.apiUrl}/media/upload`,
      body,
    );
  }

  /**
   * Upload múltiplo de mídias para notícia
   */
  uploadMultipleMedia(body: FormData): Observable<NewsMedia[]> {
    return this.http.post<NewsMedia[]>(
      `${environment.apiUrl}/media/upload-multiple`,
      body,
    );
  }

  /**
   * Atualizar mídia
   */
  updateMedia(id: number, body: Partial<NewsMedia>): Observable<NewsMedia> {
    return this.http.patch<NewsMedia>(
      `${environment.apiUrl}/media/${id}`,
      body,
    );
  }

  /**
   * Deletar mídia
   */
  deleteMedia(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/media/${id}`,
    );
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
  addVideo(body: Partial<NewsVideo>): Observable<NewsVideo> {
    return this.http.post<NewsVideo>(`${environment.apiUrl}/news-videos`, body);
  }

  /**
   * Atualizar vídeo
   */
  updateVideo(id: number, body: Partial<NewsVideo>): Observable<NewsVideo> {
    return this.http.patch<NewsVideo>(
      `${environment.apiUrl}/news-videos/${id}`,
      body,
    );
  }

  /**
   * Deletar vídeo
   */
  deleteVideo(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/news-videos/${id}`,
    );
  }

  /**
   * Listar notícias em destaque
   */
  getFeatured(): Observable<News[]> {
    return this.http.get<News[]>(`${this.apiUrl}/featured`);
  }

  /**
   * Atualizar destaque da notícia com limite de 6 (Lógica centralizada no backend)
   */
  updateEmphasis(
    newsId: number,
    isEmphasis: boolean,
  ): Observable<{ updatedNews: News; removedEmphasis?: News }> {
    return this.http
      .patch<any>(`${this.apiUrl}/${newsId}/emphasis`, { isEmphasis })
      .pipe(
        map((res) => ({
          updatedNews: res,
          removedEmphasis: res.removedEmphasis,
        })),
      );
  }
}
