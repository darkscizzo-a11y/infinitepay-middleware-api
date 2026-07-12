// src/shared/types/index.ts

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterParams extends PaginationParams {
  status?: string;
  startDate?: string;
  endDate?: string;
}
