import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('blocked_ips')
export class BlockedIp {
  @PrimaryColumn()
  ipAddress: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'timestamptz' })
  blockedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  unblockedAt: Date;
}
