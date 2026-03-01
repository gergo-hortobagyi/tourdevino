import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
}

export class VendorQueryDto {
  @IsOptional()
  @Transform(({ value }) => toNumber(value) ?? 1)
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => toNumber(value) ?? 20)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;
}
