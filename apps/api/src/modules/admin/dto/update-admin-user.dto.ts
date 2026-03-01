import { Role, UserStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateAdminUserRoleDto {
  @IsEnum(Role)
  role!: Role;
}

export class UpdateAdminUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
