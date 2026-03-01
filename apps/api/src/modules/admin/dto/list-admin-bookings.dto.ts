import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { AdminQueryDto } from './admin-query.dto.js';

export class ListAdminBookingsDto extends AdminQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;
}
