import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../services/prisma.service.js';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ params: Record<string, string | undefined>; user?: { id: string; role: string }; route?: { path?: string } }>();
    const bookingId = request.params.id;
    if (!bookingId || !request.route?.path?.includes('bookings')) {
      return true;
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, userId: true }
    });

    if (!booking) {
      return true;
    }

    const isOwner = request.user?.id === booking.userId;
    const isAdmin = request.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Ownership check failed' });
    }

    return true;
  }
}
