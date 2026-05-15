import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum MessageSenderType {
  CUSTOMER = 'CUSTOMER',
  STORE = 'STORE',
  DELIVERY = 'DELIVERY',
}

@Entity('order_messages')
export class OrderMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (o) => o.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @Column({ type: 'enum', enum: MessageSenderType })
  senderType: MessageSenderType;

  @Column()
  senderName: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
