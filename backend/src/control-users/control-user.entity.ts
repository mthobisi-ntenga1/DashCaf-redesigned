import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ControlRole {
  CHIEF_ADMIN = 'CHIEF_ADMIN',
  SENIOR_ADMIN = 'SENIOR_ADMIN',
  ADMIN_OFFICER = 'ADMIN_OFFICER',
}

@Entity('control_users')
export class ControlUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: ControlRole })
  role: ControlRole;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSuspended: boolean;

  @Column({ nullable: true, type: 'varchar' })
  suspendedReason: string | null;

  @ManyToOne(() => ControlUser, { nullable: true })
  createdBy: ControlUser;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
