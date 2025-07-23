import createError from 'http-errors';
import { StandupRepository } from "../../storage/repositories";
import { CreateStandupDto, StandupResponseDto } from "../../types";
import { IStandup } from '../../models';


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

    const createdStandup = await this.standupRepository.createOrUpdateDraft(
      userId, 
      standupData.date as Date || new Date(), 
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
}