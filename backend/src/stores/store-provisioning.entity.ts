import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Store } from './store.entity';

@Entity('store_provisioning')
export class StoreProvisioning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Store)
  @JoinColumn()
  store: Store;

  @Column()
  storeId: string;

  @Column()
  dbHost: string;

  @Column()
  dbPort: number;

  @Column()
  dbName: string;

  @Column()
  dbUser: string;

  @Column({ select: false })
  dbPassword: string;

  @Column({ type: 'timestamptz' })
  provisionedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastMigratedAt: Date;
}
