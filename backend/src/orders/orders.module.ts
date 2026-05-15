import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersGateway } from './orders.gateway';
import { OrdersService } from './orders.service';
import { OrdersController, StoreOrdersController } from './orders.controller';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderMessage } from './order-message.entity';
import { EarningsModule } from '../earnings/earnings.module';
import { MenuItem } from '../menu/menu-item.entity';
import { Store } from '../stores/store.entity';
import { Location } from '../locations/location.entity';
import { DeliveryUser } from '../delivery-users/delivery-user.entity';
import { Customer } from '../customers/customer.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { StoreStaffModule } from '../store-staff/store-staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderMessage,
      MenuItem,
      Store,
      Location,
      DeliveryUser,
      Customer,
    ]),
    EarningsModule,
    NotificationsModule,
    AuditLogsModule,
    StoreStaffModule,
  ],
  providers: [OrdersGateway, OrdersService],
  controllers: [OrdersController, StoreOrdersController],
  exports: [OrdersGateway, OrdersService],
})
export class OrdersModule {}
