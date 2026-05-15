import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryUser } from './delivery-user.entity';
import { DeliveryUsersService } from './delivery-users.service';
import { DeliveryUsersController } from './delivery-users.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryUser]), AuditLogsModule, NotificationsModule],
  providers: [DeliveryUsersService],
  controllers: [DeliveryUsersController],
  exports: [DeliveryUsersService],
})
export class DeliveryUsersModule {}
