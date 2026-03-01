import { TourStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

class TourMediaInputDto {
  @IsString()
  type!: string;

  @IsString()
  @MaxLength(1000)
  url!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  sortOrder!: number;
}

export class CreateVendorTourDto {
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
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsEnum(TourStatus)
  status?: TourStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TourMediaInputDto)
  media?: TourMediaInputDto[];
}

export class UpdateVendorTourDto {
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
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsEnum(TourStatus)
  status?: TourStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TourMediaInputDto)
  media?: TourMediaInputDto[];
}
