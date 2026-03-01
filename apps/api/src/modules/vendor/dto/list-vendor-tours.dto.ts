import { TourStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { VendorQueryDto } from './vendor-query.dto.js';

export class ListVendorToursDto extends VendorQueryDto {
  @IsOptional()
  @IsEnum(TourStatus)
  status?: TourStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;
}
