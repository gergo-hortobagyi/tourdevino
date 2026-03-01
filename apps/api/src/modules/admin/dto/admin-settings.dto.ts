import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateAdminSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  supportEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  bookingCancellationWindowHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  webhookProvider?: string;
}
