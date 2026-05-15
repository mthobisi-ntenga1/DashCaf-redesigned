import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffRole {
  KITCHEN = 'KITCHEN',
  FRONT = 'FRONT',
  ADMIN_OFFICER = 'ADMIN_OFFICER',
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('store_staff')
export class StoreStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeSlug: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ nullable: true, select: false })
  pin: string;

  @Column({ type: 'timestamptz', nullable: true })
  pinSetAt: Date;

  @Column({ type: 'enum', enum: StaffRole })
  role: StaffRole;

  @Column({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE })
  status: StaffStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
