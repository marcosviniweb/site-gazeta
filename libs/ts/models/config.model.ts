// ========== INTERFACES ==========

import { Category } from "./category.model";

export enum TopCategoryType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}

export interface TopCategoriesConfig {
  id: number;
  type: TopCategoryType;
  randomMode: boolean;
  categories: Category[];
  categoryIds: number[];
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

// Mantido para compatibilidade (aliases de TopCategoriesConfig)
export type PrimaryConfig = TopCategoriesConfig;
export type SecondaryConfig = TopCategoriesConfig;

export interface MaintenanceConfig {
  id: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface CarouselConfig {
  id: number;
  featuredNewsLimit: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface SectionOrderConfig {
  id: number;
  sectionId: string;
  name: string;
  title: string;
  order: number;
  showTitle: boolean;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface SectionOrderConfigMap {
  [sectionId: string]: SectionOrderConfig;
}

export interface SocialMediaConfig {
  id: number;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  whatsapp?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

// ========== DTOs ==========

export interface CreateTopCategoriesConfigDto {
  randomMode: boolean;
  categoryIds?: number[];
}

// Mantido para compatibilidade (deprecated)
export interface CreateDestaqueConfigDto {
  randomMode: boolean;
  categoryIds?: number[];
}

// Mantido para compatibilidade (deprecated)
export interface CreateTopGazetaConfigDto {
  randomMode: boolean;
  categoryIds?: number[];
}

export interface CreateSectionOrderDto {
  sectionId: string;
  name: string;
  title: string;
  order: number;
  showTitle: boolean;
  icon?: string;
}

export interface CreateSocialMediaConfigDto {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  whatsapp?: string;
}
