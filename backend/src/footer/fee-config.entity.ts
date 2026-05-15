import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('fee_config')
export class FeeConfig {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 2 })
  currentServiceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pendingServiceFee: number;

  @Column({ type: 'timestamptz', nullable: true })
  serviceFeeEffectiveAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
