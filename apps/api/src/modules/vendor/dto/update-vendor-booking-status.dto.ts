import { BookingStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateVendorBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
