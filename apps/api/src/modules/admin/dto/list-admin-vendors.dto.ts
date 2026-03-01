import { VendorApprovalStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { AdminQueryDto } from './admin-query.dto.js';

export class ListAdminVendorsDto extends AdminQueryDto {
  @IsOptional()
  @IsEnum(VendorApprovalStatus)
  approvalStatus?: VendorApprovalStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;
}
