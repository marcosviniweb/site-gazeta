export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Interface para os parâmetros de query de paginação comum
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  exclude?: string;
  categoryId?: number;
  status?: string;
  isEmphasis?: boolean;
  featured?: boolean;
  includeTrash?: boolean;
  month?: number;
  year?: number;
}
