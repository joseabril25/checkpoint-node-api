export interface BaseEntityDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationDto {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponseDto<T = any> {
  status: number;
  message: string;
  data?: T;
}

export interface ApiErrorDto {
  status: number;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
}