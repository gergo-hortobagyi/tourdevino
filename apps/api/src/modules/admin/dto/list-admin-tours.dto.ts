import { TourStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { AdminQueryDto } from './admin-query.dto.js';

export class ListAdminToursDto extends AdminQueryDto {
  @IsOptional()
  @IsEnum(TourStatus)
  status?: TourStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;
}
