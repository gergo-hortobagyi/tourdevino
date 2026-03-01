import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

import type { ApiEnvelope } from '../dto/api-error.dto.js';

@Injectable()
export class EnvelopeInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(
      map((result: T): ApiEnvelope<T> => {
        if (this.hasEnvelopeMeta(result)) {
          return {
            data: result.data,
            ...(result.meta ? { meta: result.meta } : {})
          };
        }

        return {
          data: result
        };
      })
    );
  }

  private hasEnvelopeMeta(value: unknown): value is { data: T; meta?: Record<string, unknown> } {
    return typeof value === 'object' && value !== null && 'data' in value;
  }
}
