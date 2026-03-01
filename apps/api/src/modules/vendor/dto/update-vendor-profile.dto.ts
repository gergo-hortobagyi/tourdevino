import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateVendorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  payoutProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  payoutAccountMasked?: string;
}
