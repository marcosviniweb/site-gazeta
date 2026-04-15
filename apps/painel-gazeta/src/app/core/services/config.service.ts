import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@site-gazeta/env';
import { Observable, map } from 'rxjs';
import { CreateTopCategoriesConfigDto, TopCategoriesConfig, CreateDestaqueConfigDto, PrimaryConfig, CreateTopGazetaConfigDto, SecondaryConfig, CreateSectionOrderDto, SectionOrderConfig, CreateSocialMediaConfigDto, SocialMediaConfig, MaintenanceConfig, CarouselConfig } from '@site-gazeta/models';


@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/config`;


  createTopCategoriesPrimary(body: CreateTopCategoriesConfigDto): Observable<TopCategoriesConfig> {
    return this.http.post<TopCategoriesConfig>(`${this.apiUrl}/top-categories-primary`, body);
  }

  updateTopCategoriesPrimary(body: Partial<CreateTopCategoriesConfigDto>): Observable<TopCategoriesConfig> {
    return this.http.patch<TopCategoriesConfig>(`${this.apiUrl}/top-categories-primary`, body);
  }

  createTopCategoriesSecondary(body: CreateTopCategoriesConfigDto): Observable<TopCategoriesConfig> {
    return this.http.post<TopCategoriesConfig>(`${this.apiUrl}/top-categories-secondary`, body);
  }

  updateTopCategoriesSecondary(body: Partial<CreateTopCategoriesConfigDto>): Observable<TopCategoriesConfig> {
    return this.http.patch<TopCategoriesConfig>(`${this.apiUrl}/top-categories-secondary`, body);
  }

  // Métodos mantidos para compatibilidade (deprecated)
  createDestaque(body: CreateDestaqueConfigDto): Observable<PrimaryConfig> {
    return this.createTopCategoriesPrimary(body);
  }

  getDestaque(): Observable<PrimaryConfig | null> {
    return this.http.get<{primary: TopCategoriesConfig | null, secondary: TopCategoriesConfig | null}>(`${this.apiUrl}/top-categories`)
      .pipe(
        map(response => response.primary as PrimaryConfig)
      );
  }

  updateDestaque(body: Partial<CreateDestaqueConfigDto>): Observable<PrimaryConfig> {
    return this.updateTopCategoriesPrimary(body);
  }

  createTopGazeta(body: CreateTopGazetaConfigDto): Observable<SecondaryConfig> {
    return this.createTopCategoriesSecondary(body);
  }

  getTopGazeta(): Observable<SecondaryConfig | null> {
    return this.http.get<{primary: TopCategoriesConfig | null, secondary: TopCategoriesConfig | null}>(`${this.apiUrl}/top-categories`)
      .pipe(
        map(response => response.secondary as SecondaryConfig)
      );
  }

  updateTopGazeta(body: Partial<CreateTopGazetaConfigDto>): Observable<SecondaryConfig> {
    return this.updateTopCategoriesSecondary(body);
  }


  createSection(body: CreateSectionOrderDto): Observable<SectionOrderConfig> {
    return this.http.post<SectionOrderConfig>(`${this.apiUrl}/sections`, body);
  }


  getSections(): Observable<SectionOrderConfig[]> {
    return this.http.get<SectionOrderConfig[]>(`${this.apiUrl}/sections`);
  }


  getSection(sectionId: string): Observable<SectionOrderConfig> {
    return this.http.get<SectionOrderConfig>(`${this.apiUrl}/sections/${sectionId}`);
  }


  updateSection(sectionId: string, body: Partial<CreateSectionOrderDto>): Observable<SectionOrderConfig> {
    return this.http.patch<SectionOrderConfig>(`${this.apiUrl}/sections/${sectionId}`, body);
  }


  bulkUpdateSections(sections: CreateSectionOrderDto[]): Observable<SectionOrderConfig[]> {
    return this.http.patch<SectionOrderConfig[]>(`${this.apiUrl}/sections`, { sections });
  }


  deleteSection(sectionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/sections/${sectionId}`);
  }

  createSocialMedia(body: CreateSocialMediaConfigDto): Observable<SocialMediaConfig> {
    return this.http.put<SocialMediaConfig>(`${this.apiUrl}/social-media`, body);
  }


  getSocialMedia(): Observable<SocialMediaConfig | null> {
    return this.http.get<SocialMediaConfig | null>(`${this.apiUrl}/social-media`);
  }


  updateSocialMedia(body: Partial<CreateSocialMediaConfigDto>): Observable<SocialMediaConfig> {
    return this.http.patch<SocialMediaConfig>(`${this.apiUrl}/social-media`, body);
  }

  // =============== MAINTENANCE CONFIG ===============

  createMaintenance(body: { isActive: boolean }): Observable<MaintenanceConfig> {
    return this.http.post<MaintenanceConfig>(`${this.apiUrl}/maintenance`, body);
  }

  getMaintenance(): Observable<MaintenanceConfig | null> {
    return this.http.get<MaintenanceConfig | null>(`${this.apiUrl}/maintenance`);
  }

  updateMaintenance(body: { isActive: boolean }): Observable<MaintenanceConfig> {
    return this.http.patch<MaintenanceConfig>(`${this.apiUrl}/maintenance`, body);
  }

  // =============== CAROUSEL CONFIG ===============

  createCarousel(body: { featuredNewsLimit: number }): Observable<CarouselConfig> {
    return this.http.post<CarouselConfig>(`${this.apiUrl}/carousel`, body);
  }

  getCarousel(): Observable<CarouselConfig | null> {
    return this.http.get<CarouselConfig | null>(`${this.apiUrl}/carousel`);
  }

  updateCarousel(body: { featuredNewsLimit: number }): Observable<CarouselConfig> {
    return this.http.patch<CarouselConfig>(`${this.apiUrl}/carousel`, body);
  }
}

