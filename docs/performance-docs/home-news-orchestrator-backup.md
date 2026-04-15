# Backup: HomeNewsOrchestratorService

## Estado ORIGINAL (sem otimizações)

Este é o backup do código ANTES das otimizações de performance.

---

## Estado INTERMEDIÁRIO (versão com concatMap sequencial)

Código temporário que foi refatorado para usar `concatMap` (processamento sequencial) para manter ordem das categorias.

**Problema identificado:** Processamento sequencial é muito lento. 14 categorias × 300ms = ~4.2s para carregar.

---

## Estado OTIMIZADO (versão atual)

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, tap, shareReplay, catchError } from 'rxjs/operators';
import { Category, News } from '@site-gazeta/models';
import {
  ApiConfigService,
  HomeCategoryGridItem,
  HomeHighlightItem,
} from './api-config.service';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface HomeCategoryConfig {
  primary: { categories: Category[] };
  secondary: { categories: Category[] };
}

@Injectable({ providedIn: 'root' })
export class HomeNewsOrchestratorService {
  private apiConfigService = inject(ApiConfigService);
  private globalExcludedIds = new Set<number>();

  // ✅ Cache da CONFIG (1x para PRIMARY + SECONDARY)
  private homeConfigCache$?: Observable<HomeCategoryConfig>;
  private homeConfigCacheEntry?: CacheEntry<HomeCategoryConfig>;

  // ✅ Caches de notícias com TTL
  private carouselCacheEntry?: CacheEntry<News[]>;
  private gridCacheEntry?: CacheEntry<HomeCategoryGridItem[]>;
  private highlightsCacheEntry?: CacheEntry<HomeHighlightItem[]>;

  private isCacheValid<T>(entry?: CacheEntry<T>): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  }

  // ✅ Uma única config cacheada para ambos
  private getHomeConfig(): Observable<HomeCategoryConfig> {
    if (this.homeConfigCacheEntry && this.isCacheValid(this.homeConfigCacheEntry)) {
      return of(this.homeConfigCacheEntry.data);
    }
    this.homeConfigCache$ = this.apiConfigService.getHomeCategoryConfig().pipe(
      tap((config) => {
        this.homeConfigCacheEntry = { data: config, timestamp: Date.now() };
      }),
      shareReplay(1),
    );
    return this.homeConfigCache$;
  }

  getCarouselNews(): Observable<News[]> { /* ... */ }
  getCategoryGrid(): Observable<HomeCategoryGridItem[]> {
    return this.getHomeConfig().pipe(
      switchMap((config) => forkJoin(...)), // ✅ forkJoin paralelo
    );
  }
  getHighlights(): Observable<HomeHighlightItem[]> {
    return this.getHomeConfig().pipe(
      switchMap((config) => forkJoin(...)), // ✅ REUTILIZA config cacheada
    );
  }

  // ✅ Método para SSR hydration
  getHydrationData() { /* ... */ }
}
```

## Resumo das Melhoreias

| Métrica                             | Antes            | Depois                         |
| ----------------------------------- | ---------------- | ------------------------------ |
| Calls para `/config/top-categories` | 2 por seção      | **1 total** (cache)            |
| Tempo total (14 cats × 300ms)       | ~4.2s sequencial | **~300ms paralelo**            |
| Cache TTL                           | Infinito         | **5 minutos**                  |
| Suporte SSR hydration               | Não              | **Sim** (`getHydrationData()`) |
