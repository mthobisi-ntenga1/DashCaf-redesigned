import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Store } from './store.entity';
import { StoreProvisioning } from './store-provisioning.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { DatabaseModule } from '../database/database.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StoreStaffModule } from '../store-staff/store-staff.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Store, StoreProvisioning]),
    DatabaseModule,
    AuditLogsModule,
    NotificationsModule,
    StoreStaffModule,
  ],
  providers: [StoresService],
  controllers: [StoresController],
  exports: [StoresService],
})
export class StoresModule {}
