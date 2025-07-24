import { BaseEntityDto } from "../common/types/common.types";
import { StandupStatus } from "../models/standup.model";

// src/types/standup.types.ts
export interface CreateStandupDto {
  yesterday: string;
  today: string;
  blockers?: string;
  status?: StandupStatus;
}

export interface UpdateStandupDto {
  yesterday?: string;
  today?: string;
  blockers?: string;
  status?: StandupStatus;
}

export enum StandupSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

export enum StandupOrderField {
  ASC = 'asc',
  DESC = 'desc'
}
export interface StandupQueryDto {
  userId?: string;
  date?: string | Date;
  dateFrom?: string;
  dateTo?: string;
  status?: StandupStatus;
  page?: number;
  limit?: number;
  sort?: StandupSortField;
  order?: StandupOrderField;
}

export interface StandupResponseDto extends BaseEntityDto {
  userId: string;
  yesterday: string;
  today: string;
  blockers?: string;
  status: StandupStatus;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
}

export interface StandupPaginatedResponseDto {
  data: StandupResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}