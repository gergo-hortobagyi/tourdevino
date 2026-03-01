import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { type AuthenticatedUser } from '../auth/auth.types.js';
import { ListVendorBookingsDto } from './dto/list-vendor-bookings.dto.js';
import { ListVendorToursDto } from './dto/list-vendor-tours.dto.js';
import { RespondVendorReviewDto } from './dto/respond-vendor-review.dto.js';
import { UpdateVendorBookingStatusDto } from './dto/update-vendor-booking-status.dto.js';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto.js';
import { UpdateVendorTourStatusDto } from './dto/update-vendor-tour-status.dto.js';
import { CreateVendorTourDto, UpdateVendorTourDto } from './dto/upsert-vendor-tour.dto.js';
import { UpsertTourAvailabilityDto } from './dto/upsert-tour-availability.dto.js';
import { VendorService } from './vendor.service.js';
import { CreateVendorApplicationDto } from './dto/create-vendor-application.dto.js';

@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorController {
  constructor(@Inject(VendorService) private readonly vendorService: VendorService) {}

  @Post('applications')
  @Roles(Role.CLIENT, Role.VENDOR)
  createApplication(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVendorApplicationDto) {
    return this.vendorService.createApplication(user, dto);
  }

  @Get('dashboard')
  @Roles(Role.VENDOR)
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.vendorService.dashboard(user.id);
  }

  @Get('analytics/overview')
  @Roles(Role.VENDOR)
  analyticsOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.vendorService.analyticsOverview(user.id);
  }

  @Get('profile')
  @Roles(Role.VENDOR)
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.vendorService.profile(user.id);
  }

  @Patch('profile')
  @Roles(Role.VENDOR)
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateVendorProfileDto) {
    return this.vendorService.updateProfile(user.id, dto);
  }

  @Get('tours')
  @Roles(Role.VENDOR)
  listTours(@CurrentUser() user: AuthenticatedUser, @Query() query: ListVendorToursDto) {
    return this.vendorService.listTours(user, query);
  }

  @Post('tours')
  @Roles(Role.VENDOR)
  createTour(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVendorTourDto) {
    return this.vendorService.createTour(user, dto);
  }

  @Get('tours/:id')
  @Roles(Role.VENDOR)
  tourById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vendorService.tourById(user, id);
  }

  @Get('tours/:id/analytics')
  @Roles(Role.VENDOR)
  tourAnalytics(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vendorService.tourAnalytics(user.id, id);
  }

  @Patch('tours/:id')
  @Roles(Role.VENDOR)
  updateTour(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateVendorTourDto) {
    return this.vendorService.updateTour(user, id, dto);
  }

  @Delete('tours/:id')
  @Roles(Role.VENDOR)
  deleteTour(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vendorService.deleteTour(user, id);
  }

  @Patch('tours/:id/status')
  @Roles(Role.VENDOR)
  updateTourStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateVendorTourStatusDto) {
    return this.vendorService.updateTourStatus(user, id, dto);
  }

  @Put('tours/:id/availability')
  @Roles(Role.VENDOR)
  upsertAvailability(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpsertTourAvailabilityDto) {
    return this.vendorService.upsertAvailability(user, id, dto);
  }

  @Get('bookings')
  @Roles(Role.VENDOR)
  listBookings(@CurrentUser() user: AuthenticatedUser, @Query() query: ListVendorBookingsDto) {
    return this.vendorService.listBookings(user.id, query);
  }

  @Get('bookings/:id')
  @Roles(Role.VENDOR)
  bookingById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vendorService.bookingById(user.id, id);
  }

  @Patch('bookings/:id/status')
  @Roles(Role.VENDOR)
  updateBookingStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateVendorBookingStatusDto) {
    return this.vendorService.updateBookingStatus(user.id, id, dto);
  }

  @Get('reviews')
  @Roles(Role.VENDOR)
  reviews(@CurrentUser() user: AuthenticatedUser) {
    return this.vendorService.listReviews(user.id);
  }

  @Post('reviews/:id/respond')
  @Roles(Role.VENDOR)
  respondReview(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: RespondVendorReviewDto) {
    return this.vendorService.respondReview(user.id, id, dto);
  }
}
