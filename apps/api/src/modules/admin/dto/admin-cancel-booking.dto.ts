import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminCancelBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
