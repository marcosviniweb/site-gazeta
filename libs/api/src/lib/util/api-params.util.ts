import { HttpParams } from '@angular/common/http';
import { PaginationParams } from '@site-gazeta/models';

/**
 * Utilitário para converter o objeto PaginationParams no formato HttpParams do Angular.
 * Filtra automaticamente valores undefined ou null.
 */
export function toHttpParams(params?: PaginationParams): HttpParams {
  let httpParams = new HttpParams();

  if (!params) {
    return httpParams;
  }

  Object.keys(params).forEach((key) => {
    const value = (params as Record<string, any>)[key];
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          httpParams = httpParams.append(key, v.toString());
        });
      } else {
        httpParams = httpParams.set(key, value.toString());
      }
    }
  });

  return httpParams;
}
