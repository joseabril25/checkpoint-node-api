import createError from 'http-errors';
import { StandupRepository } from "@/storage/repositories";
import { CreateStandupDto, StandupResponseDto, UpdateStandupDto } from "@/types";
import { IStandup } from '@/models';


export class StandupService {
  private standupRepository: StandupRepository; // Assuming you have a StandupRepository
  constructor() {
    this.standupRepository = new StandupRepository();
  }

  async createStandup(userId: string, standupData: CreateStandupDto): Promise<StandupResponseDto> {
    // Check if standup already exists for this date (like auth checks for existing user)
    const existingStandup = await this.standupRepository.findOne({ userId, date: standupData.date }) as IStandup | null;
    if (existingStandup) {
      throw createError(409, 'Standup already exists for this date');
    }

    const createdStandup = await this.standupRepository.createStandup(
      userId, 
      standupData
    );

    // Return formatted response (like auth service formats user response)
    const standupResponse: StandupResponseDto = {
      id: createdStandup.id,
      userId: createdStandup.userId.toString(),
      date: createdStandup.date,
      yesterday: createdStandup.yesterday,
      today: createdStandup.today,
      blockers: createdStandup.blockers,
      status: createdStandup.status,
      createdAt: createdStandup.createdAt,
      updatedAt: createdStandup.updatedAt
    };

    return standupResponse;
  }

  async updateStandup(
    standupId: string,
    userId: string,
    updateData: UpdateStandupDto
  ): Promise<StandupResponseDto> {
    // Find the standup and verify ownership
    const existingStandup = await this.standupRepository.findOne({
      _id: standupId,
      userId
    }) as IStandup | null;

    if (!existingStandup) {
      throw createError(404, 'Standup not found');
    }

    // Update the standup
    const updatedStandup = await this.standupRepository.updateStandup(
      standupId,
      updateData
    );

    if (!updatedStandup) {
      throw createError(500, 'Failed to update standup');
    }

    // Return formatted response
    return {
      id: updatedStandup.id,
      userId: updatedStandup.userId.toString(),
      date: updatedStandup.date,
      yesterday: updatedStandup.yesterday,
      today: updatedStandup.today,
      blockers: updatedStandup.blockers,
      status: updatedStandup.status,
      createdAt: updatedStandup.createdAt,
      updatedAt: updatedStandup.updatedAt
    };
  }
}