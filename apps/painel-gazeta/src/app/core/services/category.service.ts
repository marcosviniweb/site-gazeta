import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@site-gazeta/env';
import { Category } from '@site-gazeta/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  /**
   * Criar nova categoria
   */
  create(body: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, body);
  }

  /**
   * Listar todas as categorias (incluindo inativas)
   */
  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/all`);
  }

  /**
   * Listar apenas categorias ativas
   */
  getActive(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  /**
   * Buscar categoria por ID
   */
  getById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  /**
   * Atualizar categoria
   */
  update(id: number, body: Partial<Category>): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/${id}`, body);
  }

  /**
   * Alternar status ativo/inativo
   */
  toggleActive(id: number): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  /**
   * Deletar categoria permanentemente
   */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}/permanent`);
  }
}

