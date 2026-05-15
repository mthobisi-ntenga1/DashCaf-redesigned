import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshToken } from '../common/entities/refresh-token.entity';
import { ControlUser } from '../control-users/control-user.entity';
import { Customer } from '../customers/customer.entity';
import { DeliveryUser } from '../delivery-users/delivery-user.entity';
import { Store } from '../stores/store.entity';
import { StoreStaff } from '../store-staff/store-staff.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule,
    AuditLogsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRES', '15m') },
      }),
    }),
    TypeOrmModule.forFeature([RefreshToken, ControlUser, Customer, DeliveryUser, Store, StoreStaff]),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
