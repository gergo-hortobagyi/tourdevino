import { TourStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateAdminTourDto {
  @IsString()
  vendorId!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(240)
  slug!: string;

  @IsString()
  @MaxLength(4000)
  description!: string;

  @IsString()
  @MaxLength(120)
  region!: string;

  @IsInt()
  @Min(100)
  @Max(2_000_000)
  priceCents!: number;

  @IsInt()
  @Min(1)
  @Max(24)
  durationHours!: number;

  @IsOptional()
  @IsEnum(TourStatus)
  status?: TourStatus;
}

export class UpdateAdminTourDto {
  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(2_000_000)
  priceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  durationHours?: number;

  @IsOptional()
  @IsEnum(TourStatus)
  status?: TourStatus;
}
