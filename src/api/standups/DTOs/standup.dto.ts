import { IsEnum, IsOptional, IsString, Length, IsMongoId } from "class-validator";
import { CreateStandupDto, UpdateStandupDto } from "@/types";
import { StandupStatus } from "../../../models";

export class CreateStandupRequestDto implements CreateStandupDto {
  @IsString({ message: 'Yesterday\'s update is required' })
  @Length(1, 1000, { message: 'Yesterday\'s update must be between 1 and 1000 characters' })
  yesterday: string;

  @IsString({ message: 'Today\'s plan is required' })
  @Length(1, 1000, { message: 'Today\'s plan must be between 1 and 1000 characters' })
  today: string;

  @IsString({ message: 'Blockers information is required' })
  @Length(1, 1000, { message: 'Blockers information must be between 1 and 1000 characters' })
  @IsOptional()
  blockers: string;

  @IsEnum(StandupStatus, { message: 'Status must be a valid string' })
  @IsOptional()
  status: StandupStatus;  
}

export class UpdateStandupRequestDto implements UpdateStandupDto {
  @IsOptional()
  @IsString({ message: 'Yesterday\'s update must be a string' })
  @Length(1, 1000, { message: 'Yesterday\'s update must be between 1 and 1000 characters' })
  yesterday?: string;

  @IsOptional()
  @IsString({ message: 'Today\'s plan must be a string' })
  @Length(1, 1000, { message: 'Today\'s plan must be between 1 and 1000 characters' })
  today?: string;

  @IsOptional()
  @IsString({ message: 'Blockers information must be a string' })
  @Length(1, 1000, { message: 'Blockers information must be between 1 and 1000 characters' })
  blockers?: string;

  @IsOptional()
  @IsEnum(StandupStatus, { message: 'Status must be a valid standup status' })
  status?: StandupStatus;
}

export class StandupParamsDto {
  @IsMongoId({ message: 'Invalid standup ID format' })
  id?: string;
}