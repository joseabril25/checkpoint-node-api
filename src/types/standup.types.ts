import { BaseEntityDto } from "../common/types/common.types";
import { StandupStatus } from "../models/standup.model";

// src/types/standup.types.ts
export interface CreateStandupDto {
  yesterday: string;
  today: string;
  blockers?: string;
  status?: StandupStatus;
  date?: Date | string; // Allow string for API input
}

export interface UpdateStandupDto {
  yesterday?: string;
  today?: string;
  blockers?: string;
  status?: StandupStatus;
}

export interface StandupQueryDto {
  userId?: string;
  date?: string | Date;
  dateFrom?: string;
  dateTo?: string;
  status?: StandupStatus;
  page?: number;
  limit?: number;
  sort?: 'date' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface StandupResponseDto extends BaseEntityDto {
  userId: string;
  date: Date;
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