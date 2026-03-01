import { Injectable, Logger } from '@nestjs/common';

interface AuditLogPayload {
  action: string;
  actorId?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger('AuditLog');

  write(payload: AuditLogPayload): void {
    this.logger.log(JSON.stringify(payload));
  }
}
