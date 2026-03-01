import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminRefundDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  amountCents?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
