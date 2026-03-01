import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { type AuthenticatedUser } from '../auth/auth.types.js';
import { AdminService } from './admin.service.js';
import { AdminCancelBookingDto } from './dto/admin-cancel-booking.dto.js';
import { PatchContentPageDto, PatchFaqDto, UpsertContentPageDto, UpsertFaqDto } from './dto/admin-content.dto.js';
import { AdminQueryDto } from './dto/admin-query.dto.js';
import { AdminRefundDto } from './dto/admin-refund.dto.js';
import { ListAdminBookingsDto } from './dto/list-admin-bookings.dto.js';
import { ListAdminToursDto } from './dto/list-admin-tours.dto.js';
import { ListAdminUsersDto } from './dto/list-admin-users.dto.js';
import { ListAdminVendorsDto } from './dto/list-admin-vendors.dto.js';
import { ReportsQueryDto } from './dto/reports-query.dto.js';
import { UpdateAdminTourStatusDto } from './dto/update-admin-tour-status.dto.js';
import { UpdateAdminUserRoleDto, UpdateAdminUserStatusDto } from './dto/update-admin-user.dto.js';
import { VendorDecisionDto } from './dto/vendor-decision.dto.js';
import { ModerateReviewDto } from './dto/moderate-review.dto.js';
import { CreateAdminTourDto, UpdateAdminTourDto } from './dto/upsert-admin-tour.dto.js';
import { UpdateAdminSettingsDto } from './dto/admin-settings.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('settings')
  settings() {
    return this.adminService.settings();
  }

  @Patch('settings')
  updateSettings(@CurrentUser() admin: AuthenticatedUser, @Body() dto: UpdateAdminSettingsDto) {
    return this.adminService.updateSettings(admin, dto);
  }

  @Get('users')
  users(@Query() query: ListAdminUsersDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  userById(@Param('id') id: string) {
    return this.adminService.userById(id);
  }

  @Patch('users/:id/role')
  updateUserRole(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateAdminUserRoleDto) {
    return this.adminService.updateUserRole(admin, id, dto);
  }

  @Patch('users/:id/status')
  updateUserStatus(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateAdminUserStatusDto) {
    return this.adminService.updateUserStatus(admin, id, dto);
  }

  @Get('vendors')
  vendors(@Query() query: ListAdminVendorsDto) {
    return this.adminService.listVendors(query);
  }

  @Get('vendors/:id')
  vendorById(@Param('id') id: string) {
    return this.adminService.vendorById(id);
  }

  @Patch('vendors/:id/approve')
  approveVendor(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: VendorDecisionDto) {
    return this.adminService.approveVendor(admin, id, dto);
  }

  @Patch('vendors/:id/reject')
  rejectVendor(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: VendorDecisionDto) {
    return this.adminService.rejectVendor(admin, id, dto);
  }

  @Get('tours')
  tours(@Query() query: ListAdminToursDto) {
    return this.adminService.listTours(query);
  }

  @Get('tours/:id')
  tourById(@Param('id') id: string) {
    return this.adminService.tourById(id);
  }

  @Post('tours')
  createTour(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateAdminTourDto) {
    return this.adminService.createTour(admin, dto);
  }

  @Patch('tours/:id')
  updateTour(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateAdminTourDto) {
    return this.adminService.updateTour(admin, id, dto);
  }

  @Patch('tours/:id/status')
  updateTourStatus(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateAdminTourStatusDto) {
    return this.adminService.updateTourStatus(admin, id, dto);
  }

  @Get('bookings')
  bookings(@Query() query: ListAdminBookingsDto) {
    return this.adminService.listBookings(query);
  }

  @Get('bookings/:id')
  bookingById(@Param('id') id: string) {
    return this.adminService.bookingById(id);
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: AdminCancelBookingDto) {
    return this.adminService.cancelBooking(admin, id, dto);
  }

  @Post('payments/:bookingId/refund')
  refundPayment(@CurrentUser() admin: AuthenticatedUser, @Param('bookingId') bookingId: string, @Body() dto: AdminRefundDto) {
    return this.adminService.refundPayment(admin, bookingId, dto);
  }

  @Get('content')
  content(@Query() query: AdminQueryDto) {
    return this.adminService.listContent(query);
  }

  @Post('content')
  createContent(@CurrentUser() admin: AuthenticatedUser, @Body() dto: UpsertContentPageDto) {
    return this.adminService.createContentPage(admin, dto);
  }

  @Patch('content/:id')
  updateContent(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: PatchContentPageDto) {
    return this.adminService.updateContentPage(admin, id, dto);
  }

  @Delete('content/:id')
  deleteContent(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.adminService.deleteContentPage(admin, id);
  }

  @Post('faq')
  createFaq(@CurrentUser() admin: AuthenticatedUser, @Body() dto: UpsertFaqDto) {
    return this.adminService.createFaq(admin, dto);
  }

  @Patch('faq/:id')
  updateFaq(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: PatchFaqDto) {
    return this.adminService.updateFaq(admin, id, dto);
  }

  @Delete('faq/:id')
  deleteFaq(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.adminService.deleteFaq(admin, id);
  }

  @Patch('reviews/:id/moderate')
  moderateReview(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.adminService.moderateReview(admin, id, dto);
  }

  @Get('analytics/overview')
  analyticsOverview() {
    return this.adminService.analyticsOverview();
  }

  @Get('reports/revenue')
  revenueReport(@Query() query: ReportsQueryDto) {
    return this.adminService.revenueReport(query);
  }

  @Get('reports/conversion')
  conversionReport(@Query() query: ReportsQueryDto) {
    return this.adminService.conversionReport(query);
  }
}
