import { TourStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateAdminTourStatusDto {
  @IsEnum(TourStatus)
  status!: TourStatus;
}
