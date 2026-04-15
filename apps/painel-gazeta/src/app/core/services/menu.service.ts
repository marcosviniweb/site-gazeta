import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@site-gazeta/env';
import { Menu } from '@site-gazeta/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/menu`;

  /**
   * Criar novo menu
   */
  create(body: Menu): Observable<Menu> {
    return this.http.post<Menu>(this.apiUrl, body);
  }

  /**
   * Criar múltiplos menus do tipo category em uma única requisição
   */
  createCategoryMenus(menus: Array<{ name: string; slug: string; order?: number }>, parentId?: number | null): Observable<Menu[]> {
    return this.http.post<Menu[]>(`${this.apiUrl}/categories/batch`, { menus, parentId });
  }

  /**
   * Listar todos os menus
   */
  getAll(): Observable<Menu[]> {
    return this.http.get<Menu[]>(this.apiUrl);
  }

  /**
   * Buscar menu por ID
   */
  getById(id: number): Observable<Menu> {
    return this.http.get<Menu>(`${this.apiUrl}/${id}`);
  }

  /**
   * Atualizar menu
   */
  update(id: number, body: Partial<Menu>): Observable<Menu> {
    return this.http.patch<Menu>(`${this.apiUrl}/${id}`, body);
  }

  /**
   * Reordenar menus em lote
   */
  reorder(body: { menus: { id: number; order: number }[] }): Observable<Menu[]> {
    return this.http.patch<Menu[]>(`${this.apiUrl}/reorder/batch`, body);
  }

  /**
   * Mover menu para submenu ou remover de submenu
   */
  moveToSubmenu(menuId: number, parentId: number | null): Observable<Menu> {
    return this.http.patch<Menu>(`${this.apiUrl}/${menuId}`, { parentId });
  }

  /**
   * Deletar menu
   */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

