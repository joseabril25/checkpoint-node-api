import { Request, Response } from 'express';
import { ApiResponse, asyncHandler } from "../../common/utils";
import { AuthService } from "./auth.service";
import { RegisterRequestDto } from './DTOs/register.dto';

const authService = new AuthService();

export const registerUser = asyncHandler(
  async (req: Request<{}, {}, RegisterRequestDto>, res: Response) => {
    const user = await authService.registerUser(req.body);
    ApiResponse.success(res, user, "User registered successfully", 201);
  }
);