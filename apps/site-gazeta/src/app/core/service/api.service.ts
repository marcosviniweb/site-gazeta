import { inject, Injectable } from '@angular/core';
import { Category, News, Video, Menu, Ads, DestaqueConfig, TopGazetaConfig, SectionOrderConfig, SectionOrderConfigMap } from '@site-gazeta/models';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../env/env';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  constructor() { }
  
  getMenu(){
    return this.http.get<Menu[]>(`${this.apiUrl}/menu`);
  }

  getMenuById(id: number){
    return this.http.get(`${this.apiUrl}/menu/${id}`);
  }
  getHomeConfig(){
    return this.http.get<SectionOrderConfig[]>(`${this.apiUrl}/config/sections`);
  }

  getHomeConfigMap(){
    return this.http.get<SectionOrderConfigMap>(`${this.apiUrl}/config/sections-map`).pipe(
      map(config => {
        // Se não houver configurações, retornar valores padrão
        if (!config || Object.keys(config).length === 0) {
          const now = new Date().toISOString();
          return {
            carousel: { 
              id: 0,
              sectionId: 'carousel',
              name: 'Carrossel',
              title: 'Últimas Notícias',
              order: 1,
              showTitle: true,
              icon: 'view_carousel',
              createdAt: now,
              updatedAt: now,
              createdBy: 0
            },
            destaques: { 
              id: 0,
              sectionId: 'destaques',
              name: 'Destaques',
              title: 'Destaques',
              order: 2,
              showTitle: true,
              icon: 'star',
              createdAt: now,
              updatedAt: now,
              createdBy: 0
            },
            videos: { 
              id: 0,
              sectionId: 'videos',
              name: 'Vídeos',
              title: 'Vídeos em Alta',
              order: 3,
              showTitle: true,
              icon: 'play_circle',
              createdAt: now,
              updatedAt: now,
              createdBy: 0
            },
            'top-gazeta': { 
              id: 0,
              sectionId: 'top-gazeta',
              name: 'Top Gazeta',
              title: 'Top Gazeta',
              order: 4,
              showTitle: true,
              icon: 'trending_up',
              createdAt: now,
              updatedAt: now,
              createdBy: 0
            },
            cluster: { 
              id: 0,
              sectionId: 'cluster',
              name: 'Cluster',
              title: 'Mais Notícias',
              order: 5,
              showTitle: true,
              icon: 'apps',
              createdAt: now,
              updatedAt: now,
              createdBy: 0
            }
          } as SectionOrderConfigMap;
        }
        return config;
      })
    );
  }
  
  getHomeCategoryConfig(){
    return forkJoin([
      this.http.get<DestaqueConfig | null>(`${this.apiUrl}/config/destaques`).pipe(
        map(config => {
          if (config) return config;
          const now = new Date().toISOString();
          return { 
            id: 0,
            categories: [], 
            categoryIds: [], 
            randomMode: true,
            createdAt: now,
            updatedAt: now,
            createdBy: 0
          } as DestaqueConfig;
        })
      ),
      this.http.get<TopGazetaConfig | null>(`${this.apiUrl}/config/top-gazeta`).pipe(
        map(config => {
          if (config) return config;
          const now = new Date().toISOString();
          return { 
            id: 0,
            categories: [], 
            categoryIds: [], 
            randomMode: true,
            createdAt: now,
            updatedAt: now,
            createdBy: 0
          } as TopGazetaConfig;
        })
      ),
    ])
    .pipe(
      map(([destaque, topGazeta]) => {
        return {
          destaque,
          topGazeta,
        }
      })
    )
  }
  getVideos(){
    return this.http.get<Video[]>(`${this.apiUrl}/videos`);
  }

  getVideosById(id: number) {
    return this.http.get<Video>(`${this.apiUrl}/videos/${id}`);
  }

  getNews(){
    return this.http.get<News[]>(`${this.apiUrl}/news`);
  }

  getNewsById(id: number){
    return this.http.get(`${this.apiUrl}/news/${id}`);
  }
  
  getCategories(){
    return this.http.get<Category[]>(`${this.apiUrl}/categories/all`);
  }

  getActiveCategories(){
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategory(id: number){
    return this.http.get(`${this.apiUrl}/categories/${id}`);
  }

  getAds(){
    return this.http.get<Ads[]>(`${this.apiUrl}/advertisements`);
  }

  getAdsById(id: number){
    return this.http.get(`${this.apiUrl}/advertisements/${id}`);
  }

  getAdsByPositionAndPlacement(placement: string,position: string ){
    return this.http.get<Ads[]>(`${this.apiUrl}/advertisements/active/${placement}/${position}`);
  }
  getAdsByPlacement(placement: string){
    return this.http.get<Ads[]>(`${this.apiUrl}/advertisements/by-page/${placement}`);
  }

  getNewsBySlug(slug: string): Observable<News | undefined> {
    return this.http.get<News>(`${this.apiUrl}/news/slug/${slug}`);
  }

  getCategoryBySlug(slug: string): Observable<Category | undefined> {
    return this.http.get<Category>(`${this.apiUrl}/categories/slug/${slug}`)
  }


  getNewsByCategory(categoryId: number): Observable<News[]> {
    return this.http.get<News[]>(`${this.apiUrl}/news`).pipe(
      map((news) => news.filter((news) => news.categoryId.includes(categoryId)))
    )
  }

  getRelatedNews(categoryId: number[], newsId: number): Observable<News[]> {
    return this.http.get<News[]>(`${this.apiUrl}/news`).pipe(
      map((news) => news.filter((news) =>{
        return news.categoryId.some(id => categoryId.includes(id)) && news.id !== newsId
      })) 
    )
  };

  getNewsFeatured() {
    // Sempre busca as notícias em destaque atualizadas do servidor
    return this.http.get<News[]>(`${this.apiUrl}/news/featured`);
  }

  getNewsForCategory(categoryId: number): Observable<News[]> {
    return this.http.get<News[]>(`${this.apiUrl}/news/category/${categoryId}`);
  }
  getBySearch(search: string, limit?: number): Observable<News[]> {
    return this.http.get<News[]>(`${this.apiUrl}/news/search?search=${search}&limit=${limit}`);
  }
}
