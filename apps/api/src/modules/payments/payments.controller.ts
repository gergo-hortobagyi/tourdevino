import { Body, Controller, Get, Headers, Inject, Param, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CreateIntentDto } from './dto/create-intent.dto.js';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly paymentsService: PaymentsService) {}

  @Post('intents')
  @UseGuards(JwtAuthGuard)
  async createIntent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIntentDto,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    return this.paymentsService.createIntent(user.id, dto.bookingId, idempotencyKey ?? dto.idempotencyKey);
  }

  @Get(':bookingId/status')
  @UseGuards(JwtAuthGuard)
  async status(@CurrentUser() user: AuthenticatedUser, @Param('bookingId') bookingId: string) {
    return this.paymentsService.paymentStatus(user.id, bookingId);
  }

  @Post('webhooks/stripe')
  async webhook(
    @Body() body: { providerRef?: string; status?: 'succeeded' | 'failed' },
    @Headers('stripe-signature') signatureHeader: string | undefined,
    @Req() req: Request & { rawBody?: string }
  ) {
    return this.paymentsService.webhook(body, signatureHeader, req.rawBody ?? JSON.stringify(body));
  }

  @Post(':bookingId/simulate')
  @UseGuards(JwtAuthGuard)
  async simulate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body() body: { status: 'succeeded' | 'failed' }
  ) {
    return this.paymentsService.simulate(user.id, bookingId, body.status);
  }
}
