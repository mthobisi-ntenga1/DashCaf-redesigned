import { APP_GUARD } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ControlUsersModule } from './control-users/control-users.module';
import { StoresModule } from './stores/stores.module';
import { CustomersModule } from './customers/customers.module';
import { DeliveryUsersModule } from './delivery-users/delivery-users.module';
import { LocationsModule } from './locations/locations.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EarningsModule } from './earnings/earnings.module';
import { SupportModule } from './support/support.module';
import { FooterModule } from './footer/footer.module';
import { MenuModule } from './menu/menu.module';
import { CartModule } from './cart/cart.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { StoreStaffModule } from './store-staff/store-staff.module';

import { BlockedIp } from './common/entities/blocked-ip.entity';
import { IpBlockMiddleware } from './common/middleware/ip-block.middleware';
import { ControlUsersService } from './control-users/control-users.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60000, limit: 100 },
      { name: 'auth', ttl: 900000, limit: 10 },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([BlockedIp]),
    AuthModule,
    ControlUsersModule,
    StoresModule,
    CustomersModule,
    DeliveryUsersModule,
    LocationsModule,
    MenuModule,
    CartModule,
    AuditLogsModule,
    StoreStaffModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    EarningsModule,
    SupportModule,
    FooterModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(private readonly controlUsersService: ControlUsersService) {}

  async onModuleInit() {
    await this.controlUsersService.seedChiefAdmin();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IpBlockMiddleware).forRoutes('*');
  }
}
