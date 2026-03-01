import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
}

export class ListToursDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(1)
  @Max(5)
  ratingMin?: number;

  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'rating_desc', 'newest'])
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';

  @IsOptional()
  @Transform(({ value }) => toNumber(value) ?? 1)
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => toNumber(value) ?? 12)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 12;
}
