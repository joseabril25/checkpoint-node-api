import { BaseEntityDto } from "../common/types/common.types";

export interface CreateRefreshTokenDto {
  userId:  string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export interface RefreshTokenResponseDto extends BaseEntityDto {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  lastUsedAt?: Date;
  expiresAt: Date;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}