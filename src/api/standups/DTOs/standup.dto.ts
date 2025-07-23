import { IsEnum, IsOptional, IsString, Length, IsMongoId, IsNumber } from "class-validator";
import { CreateStandupDto, StandupOrderField, StandupQueryDto, StandupSortField, UpdateStandupDto } from "@/types";
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

export class GetStandupsQueryDto implements StandupQueryDto {
  @IsOptional()
  @IsMongoId({ message: 'Invalid user ID format' })
  userId?: string;

  @IsOptional()
  @IsString({ message: 'Date must be a valid string' })
  date?: string;

  @IsOptional()
  @IsString({ message: 'Date from must be a valid string' })
  dateFrom?: string;

  @IsOptional()
  @IsString({ message: 'Date to must be a valid string' })
  dateTo?: string;

  @IsOptional()
  @IsEnum(StandupStatus, { message: 'Status must be a valid standup status' })
  status?: StandupStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  limit?: number;

  @IsOptional()
  @IsEnum(StandupSortField, { message: 'Sort must be a valid standup sort field' })
  sort?: StandupSortField;

  @IsOptional()
  @IsEnum(StandupOrderField, { message: 'Order must be a valid standup order field' })
  order?: StandupOrderField;
}