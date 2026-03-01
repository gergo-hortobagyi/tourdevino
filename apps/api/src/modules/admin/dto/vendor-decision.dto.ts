import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VendorDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
