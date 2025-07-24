import { Request, Response } from 'express';
import { ApiResponse, asyncHandler } from "@/common/utils";
import { UserService } from "./users.service";

const userService = new UserService();

export const getAllUsers = asyncHandler(
  async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers();

    ApiResponse.success(res, users, "User profiles retrieved successfully");
  }
);