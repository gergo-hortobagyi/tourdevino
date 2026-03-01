import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', 'api');
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:40000');
  const port = config.get<number>('PORT', 40001);

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
        value: false
      }
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.enableCors({
    origin: corsOrigin,
    credentials: true
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header('x-request-id') ?? randomUUID();
    res.setHeader('x-request-id', requestId);

    const startedAt = Date.now();
    res.on('finish', () => {
      const entry = {
        event: 'http_request',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt
      };
      console.log(JSON.stringify(entry));
    });

    next();
  });

  const bodyLimit = config.get<string>('REQUEST_BODY_LIMIT', '1mb');
  app.use(
    json({
      limit: bodyLimit,
      verify: (req: Request & { rawBody?: string }, _res, buffer): void => {
        req.rawBody = buffer.toString('utf8');
      }
    })
  );

  await app.listen(port);
}

void bootstrap();
