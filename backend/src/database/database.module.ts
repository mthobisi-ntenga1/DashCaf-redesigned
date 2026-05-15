import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../common/entities/audit-log.entity';
import { BlockedIp } from '../common/entities/blocked-ip.entity';
import { RefreshToken } from '../common/entities/refresh-token.entity';
import { ControlUser } from '../control-users/control-user.entity';
import { Customer } from '../customers/customer.entity';
import { DeliveryUser } from '../delivery-users/delivery-user.entity';
import { FeeConfig } from '../footer/fee-config.entity';
import { GlobalConfig } from '../footer/global-config.entity';
import { Location } from '../locations/location.entity';
import { MenuCategory } from '../menu/menu-category.entity';
import { MenuItem } from '../menu/menu-item.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { OrderMessage } from '../orders/order-message.entity';
import { Store } from '../stores/store.entity';
import { StoreProvisioning } from '../stores/store-provisioning.entity';
import { SupportTicket } from '../support/support-ticket.entity';
import { StoreStaff } from '../store-staff/store-staff.entity';
import { StoreDbService } from './store-db.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        database: config.get('DB_NAME', 'dashcaf_control'),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASS', 'postgres'),
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: false,
        entities: [
          ControlUser,
          Store,
          StoreProvisioning,
          Customer,
          DeliveryUser,
          Location,
          SupportTicket,
          GlobalConfig,
          FeeConfig,
          RefreshToken,
          AuditLog,
          BlockedIp,
          MenuCategory,
          MenuItem,
          Order,
          OrderItem,
          OrderMessage,
          StoreStaff,
        ],
      }),
    }),
  ],
  providers: [StoreDbService],
  exports: [StoreDbService],
})
export class DatabaseModule {}
