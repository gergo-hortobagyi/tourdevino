import { Body, Controller, Get, Headers, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { BookingsService } from './bookings.service.js';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(@Inject(BookingsService) private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookingDto, @Headers('idempotency-key') idempotencyKey?: string) {
    return this.bookingsService.createBooking(user.id, dto, idempotencyKey);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.myBookings(user.id);
  }

  @Get(':id')
  async byId(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bookingsService.bookingById(user.id, id);
  }

  @Patch(':id/cancel')
  async cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(user.id, id);
  }
}
