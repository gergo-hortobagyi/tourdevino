import { Global, Module } from '@nestjs/common';

import { AuditLogService } from './services/audit-log.service.js';
import { CacheService } from './services/cache.service.js';
import { PrismaService } from './services/prisma.service.js';

@Global()
@Module({
  providers: [PrismaService, AuditLogService, CacheService],
  exports: [PrismaService, AuditLogService, CacheService]
})
export class CommonModule {}
