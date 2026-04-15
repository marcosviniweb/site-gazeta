# Backup: exclude-news.interceptor.ts

## Estado Original - Antes das Otimizações

**Arquivo:** `apps/site-gazeta/src/app/core/interceptor/exclude-news.interceptor.ts`

```typescript
import { HttpInterceptorFn, HttpParams } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NewsManagerService } from '../service/news-manager.service';

/**
 * Interceptor que adiciona automaticamente IDs excluídos nos endpoints de notícias
 *
 * Funciona de forma inteligente:
 * - Detecta endpoints de notícias que suportam o parâmetro 'exclude'
 * - Injeta automaticamente os IDs de notícias já exibidas
 * - Evita duplicatas na mesma página
 * - Funciona apenas no browser (não afeta SSR)
 */
export const excludeNewsInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Apenas processa no browser
  if (!isBrowser) {
    return next(req);
  }

  const newsManagerService = inject(NewsManagerService);
  const url = req.url;

  // Lista de endpoints que suportam o parâmetro 'exclude'
  // NOTA: latest-news e most-viewed NÃO estão incluídos pois devem mostrar sempre
  // as mais recentes/mais vistas, mesmo que já tenham sido exibidas em outras seções
  const newsEndpointsWithExclude = ['/news/featured', '/news/category/', '/news'];

  // Endpoints que NÃO devem receber exclude
  const excludedEndpoints = ['/news/most-viewed', '/news/latest-news', '/news/search'];

  // Verifica se é um endpoint de notícias que suporta exclusão
  const isExcludedEndpoint = excludedEndpoints.some((endpoint) => url.includes(endpoint));
  const isNewsEndpoint = !isExcludedEndpoint && newsEndpointsWithExclude.some((endpoint) => url.includes(endpoint));

  if (isNewsEndpoint && newsManagerService.excludedIds.length > 0) {
    // Pega os IDs excluídos
    const excludeIds = newsManagerService.excludedIds.join(',');

    // Adiciona o parâmetro 'exclude' na requisição
    let params = req.params || new HttpParams();

    // Não sobrescreve se já existe um parâmetro exclude (permite override manual)
    if (!params.has('exclude')) {
      params = params.set('exclude', excludeIds);
    }

    // Clona a requisição com os novos parâmetros
    const modifiedReq = req.clone({ params });

    return next(modifiedReq);
  }

  // Se não é um endpoint de notícias, passa sem modificar
  return next(req);
};
```

## Problemas Identificados

1. **Performance:** Arrays重新创建 a cada request - `.some()` executa 4x por request

2. **Código quente:** Lógica de validação executada para TODAS as requisições, mesmo as que não são de notícias

3. **String matching:** `includes()` é menos performático que regex pré-compilado
