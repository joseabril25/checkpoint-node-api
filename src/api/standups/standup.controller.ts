import { Request, Response } from 'express';
import { ApiResponse, asyncHandler } from "@/common/utils";
import { CreateStandupDto } from "@/types";
import { StandupService } from "./standup.service";

const standupService = new StandupService();

export const createStandup = asyncHandler(
  async (req: Request<{}, {}, CreateStandupDto>, res: Response) => {
    const userId = req.user?.userId as string;
    const standupData = req.body;

    const createdStandup = await standupService.createStandup(userId, standupData);

    ApiResponse.success(res, createdStandup, "Standup created successfully", 201);
  }
);