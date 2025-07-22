import { UserResponseDto } from "./user.types";


export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  timezone: string;
  profileImage?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}