import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginDto } from '../../../types';

export class LoginRequestDto implements LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}