import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import type { ApiEnvelope } from '../dto/api-error.dto.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = response.getHeader('x-request-id') ?? request.header('x-request-id');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const payload = exceptionResponse as Record<string, unknown>;
        message = typeof payload.message === 'string' ? payload.message : message;
        details = payload.details ?? (Array.isArray(payload.message) ? payload.message : undefined);
        code = typeof payload.code === 'string' ? payload.code : this.defaultCode(status);
      }
    }

    if (!(exception instanceof HttpException)) {
      console.error(exception);
    }

    const errorPayload: ApiEnvelope<null> = {
      data: null,
      error: {
        code,
        message,
        ...(typeof requestId === 'string' ? { requestId } : {}),
        ...(details !== undefined ? { details } : {})
      }
    };

    response.status(status).json(errorPayload);
  }

  private defaultCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
