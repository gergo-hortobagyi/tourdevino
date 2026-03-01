import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../common/services/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('live')
  live() {
    return { ok: true, service: 'api' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, database: 'up' };
    } catch {
      throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'Database is not ready' });
    }
  }
}
