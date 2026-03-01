import { TourStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateVendorTourStatusDto {
  @IsEnum(TourStatus)
  status!: TourStatus;
}
