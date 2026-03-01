import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  tourId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  guestCount!: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
