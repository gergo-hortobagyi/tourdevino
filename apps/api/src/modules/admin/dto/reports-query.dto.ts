import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

function toDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value);
}

export class ReportsQueryDto {
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  @IsDateString()
  from?: string;

  @IsOptional()
  @Transform(({ value }) => toDate(value))
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month';
}
