import { Request, Response } from 'express';
import { ApiResponse, asyncHandler } from "../../common/utils";
import { AuthService } from "./auth.service";
import { RegisterRequestDto } from './DTOs/register.dto';
import { LoginRequestDto } from './DTOs/login.dto';

const authService = new AuthService();

export const registerUser = asyncHandler(
  async (req: Request<{}, {}, RegisterRequestDto>, res: Response) => {
    const result = await authService.register(req.body);
    
    // Set cookies BEFORE sending response
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    ApiResponse.success(res, result.user, "User registered successfully", 201);
  }
);


export const loginUser = asyncHandler(
  async (req: Request<{}, {}, LoginRequestDto>, res: Response) => {
    const result = await authService.login(req.body);
    
    // Set cookies BEFORE sending response
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    ApiResponse.success(res, result.user, "User logged in successfully");
  }
);

export const logoutUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    await authService.logout(refreshToken);
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    ApiResponse.noContent(res);
  }
);

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const result = await authService.refreshToken(refreshToken);
    
    // Set new access token cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
    ApiResponse.noContent(res);
  }
);

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId; // AuthGuard ensures req.user exists

    const user = await authService.getCurrentUser(userId);
    
    ApiResponse.success(res, user, "User profile retrieved successfully");
  }
);