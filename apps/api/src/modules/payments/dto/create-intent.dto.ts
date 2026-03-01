import { IsOptional, IsString } from 'class-validator';

export class CreateIntentDto {
  @IsString()
  bookingId!: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
