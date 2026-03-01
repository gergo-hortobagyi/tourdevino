import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

import { VendorQueryDto } from './vendor-query.dto.js';

export class ListVendorBookingsDto extends VendorQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
