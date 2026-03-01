import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVendorApplicationDto {
  @IsString()
  @MaxLength(120)
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  payoutProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  payoutAccountMasked?: string;
}
