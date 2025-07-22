import { BaseEntityDto } from "../common/types/common.types";
import { UserStatus } from "../models/user.model";

// src/types/user.types.ts (complete version)
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  timezone: string;
  profileImage?: string;
}

export interface UpdateUserDto {
  name?: string;
  timezone?: string;
  profileImage?: string;
  status?: UserStatus;
}

export interface UserResponseDto extends BaseEntityDto {
  email: string;
  name: string;
  timezone: string;
  profileImage?: string;
  status: UserStatus;
}

export interface UserQueryDto {
  email?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
}