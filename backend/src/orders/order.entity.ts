import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderMessage } from './order-message.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COOKING = 'COOKING',
  READY = 'READY',
  CLAIMED = 'CLAIMED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  COLLECT  = 'COLLECT',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  storeSlug: string;

  @Column()
  storeName: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.DELIVERY })
  orderType: OrderType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  /** Platform service fee — R2 on every order regardless of type */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  /**
   * Delivery fee — R5 on delivery orders, R0 on collect.
   * Splits: R3 → platform, R2 → rider (tracked in earnings).
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ nullable: true, type: 'varchar' })
  deliveryLocationId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  deliveryLocationName: string | null;

  @Column({ nullable: true, type: 'text' })
  deliveryNote: string | null;

  @Column({ nullable: true, type: 'varchar', length: 4 })
  handoffCode: string | null;

  @Column({ nullable: true, type: 'varchar' })
  claimedByUserId: string | null;

  /** Customer rating (1–5) left after delivery */
  @Column({ nullable: true, type: 'smallint' })
  rating: number | null;

  /** Optional written review */
  @Column({ nullable: true, type: 'text' })
  review: string | null;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true, eager: true })
  items: OrderItem[];

  @OneToMany(() => OrderMessage, (m) => m.order, { cascade: true, eager: false })
  messages: OrderMessage[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
