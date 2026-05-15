import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('global_config')
export class GlobalConfig {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ default: 'DashCaf' })
  footerAppName: string;

  @Column({ default: 'support@dashcaf.com' })
  footerSupportEmail: string;

  @Column({ default: 'Campus food, delivered fast' })
  footerTagline: string;

  @Column({ default: 'v1.0.0' })
  footerVersionLabel: string;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
