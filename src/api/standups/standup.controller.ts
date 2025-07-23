import { Request, Response } from 'express';
import { ApiResponse, asyncHandler } from "@/common/utils";
import { StandupService } from "./standup.service";
import { UpdateStandupRequestDto, CreateStandupRequestDto, StandupParamsDto } from './DTOs/standup.dto';

const standupService = new StandupService();

export const createStandup = asyncHandler(
  async (req: Request<{}, {}, CreateStandupRequestDto>, res: Response) => {
    const userId = req.user?.userId as string;
    const standupData = req.body;

    const createdStandup = await standupService.createStandup(userId, standupData);

    ApiResponse.success(res, createdStandup, "Standup created successfully", 201);
  }
);

export const updateStandup = asyncHandler(
  async (req: Request<StandupParamsDto, {}, UpdateStandupRequestDto>, res: Response) => {
    const userId = req.user?.userId as string;
    const { id: standupId } = req.params;
    const updateData = req.body;

    const updatedStandup = await standupService.updateStandup(standupId!, userId, updateData);

    ApiResponse.success(res, updatedStandup, "Standup updated successfully");
  }
);