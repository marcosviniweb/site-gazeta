import { HttpInterceptorFn, HttpParams } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NewsManagerService } from '../service/news-manager.service';

// ✅ Padrões regex pré-compilados para performance
const NEWS_ENDPOINTS_WITH_EXCLUDE = [
  /\/news\/featured$/,
  /\/news\/category\/\d+/,
  /\/news(\?|$)/,
];

// ✅ Endpoints que NÃO devem receber exclude (verifica primeiro)
const EXCLUDED_ENDPOINTS = [
  '/news/most-viewed',
  '/news/latest-news',
  '/news/search',
];

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

  const url = req.url;

  // ✅ Early exit - ignora se não é endpoint de notícias
  if (!url.includes('/news')) {
    return next(req);
  }

  // ✅ Verifica endpoints excluídos PRIMEIRO (mais rápido)
  const isExcludedEndpoint = EXCLUDED_ENDPOINTS.some((endpoint) =>
    url.includes(endpoint),
  );
  if (isExcludedEndpoint) {
    return next(req);
  }

  // ✅ Detecta endpoints que suportam exclude com regex pré-compilado
  const isNewsEndpoint = NEWS_ENDPOINTS_WITH_EXCLUDE.some((pattern) =>
    pattern.test(url),
  );

  if (isNewsEndpoint) {
    const newsManagerService = inject(NewsManagerService);

    if (newsManagerService.excludedIds.length > 0) {
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
  }

  // Se não é um endpoint de notícias, passa sem modificar
  return next(req);
};
