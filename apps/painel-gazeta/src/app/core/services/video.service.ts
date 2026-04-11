import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../env/env';
import { Video, PaginatedResponse, PaginationParams } from '@site-gazeta/models';
import { toHttpParams } from '@site-gazeta/api';
import { Observable } from 'rxjs';

// Interface local removida

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/videos`;

  /**
   * Upload de vídeo
   */
  upload(body: FormData): Observable<Video> {
    return this.http.post<Video>(`${this.apiUrl}/upload`, body);
  }

  /**
   * Listar todos os vídeos (Paginado / Filtrado)
   */
  getAll(params?: PaginationParams): Observable<PaginatedResponse<Video>> {
    const httpParams = toHttpParams(params);
    return this.http.get<PaginatedResponse<Video>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Buscar vídeo por ID
   */
  getById(id: number): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/${id}`);
  }

  /**
   * Atualizar vídeo (com FormData - suporta arquivos)
   */
  update(id: number, body: FormData): Observable<Video> {
    return this.http.patch<Video>(`${this.apiUrl}/${id}/upload`, body);
  }

  /**
   * Deletar vídeo
   */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

