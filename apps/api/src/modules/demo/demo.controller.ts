import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { OwnershipGuard } from '../../common/guards/ownership.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('demo')
export class DemoController {
  @Get('health')
  health() {
    return { ok: true };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminOnly() {
    return { ok: true };
  }

  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  bookingOwner(@Param('id') id: string) {
    return { bookingId: id };
  }
}
