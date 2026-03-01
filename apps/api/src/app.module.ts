import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { CommonModule } from './common/common.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { OwnershipGuard } from './common/guards/ownership.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { DemoModule } from './modules/demo/demo.module.js';
import { ToursModule } from './modules/tours/tours.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { ContentModule } from './modules/content/content.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { VendorModule } from './modules/vendor/vendor.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120
      }
    ]),
    CommonModule,
    AuthModule,
    UsersModule,
    DemoModule,
    ToursModule,
    ReviewsModule,
    ContentModule,
    BookingsModule,
    PaymentsModule,
    VendorModule,
    AdminModule,
    HealthModule
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    OwnershipGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
