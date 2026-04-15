# Backup: news-ids.interceptor.ts

## Estado Original - Antes das Otimizações

**Arquivo:** `apps/site-gazeta/src/app/core/interceptor/news-ids.interceptor.ts`

```typescript
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';
import { NewsManagerService } from '../service/news-manager.service';
import { News } from '@site-gazeta/models';

/**
 * Interceptor que captura IDs de notícias das respostas HTTP
 *
 * Funcionalidades:
 * - Detecta respostas de endpoints de notícias
 * - Extrai IDs das notícias retornadas
 * - Adiciona IDs ao NewsManagerService (apenas em memória)
 * - Funciona apenas no browser (não afeta SSR)
 */
export const newsIdsInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Apenas processa no browser
  if (!isBrowser) {
    return next(req);
  }

  const newsManagerService = inject(NewsManagerService);

  return next(req).pipe(
    tap((response) => {
      const responseData = response as HttpResponse<any>;
      const url = req.url;

      // Detecta endpoints de notícias
      const isNewsEndpoint = (url.includes('/news') && !url.includes('/news/')) || url.match(/\/news\/(featured|category|latest-news|search)/);

      if (isNewsEndpoint && Array.isArray(responseData.body) && responseData.body.length > 0) {
        const firstItem = responseData.body[0];

        // Verifica se é um array de notícias (tem ID)
        if (firstItem && typeof firstItem === 'object' && 'id' in firstItem) {
          const ids = (responseData.body as News[]).map((news: News) => news.id);

          if (ids.length > 0) {
            newsManagerService.excludeIds(ids);
          }
        }
      }
    }),
  );
};
```

## Problemas Identificados

1. **Bug lógico (linha 34-36):** Precedence de operadores incorreto
   - `url.includes('/news') && !url.includes('/news/') || url.match(...)`
   - Deveria ser: `url.includes('/news') && (!url.includes('/news/') || url.match(...))`

2. **Performance:** regex compilado em cada request

3. **Edge case:** urls como `/news/123` falham na detecção
