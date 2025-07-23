import { IsEnum, IsOptional, IsString, Length } from "class-validator";
import { CreateStandupDto } from "@/types";
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