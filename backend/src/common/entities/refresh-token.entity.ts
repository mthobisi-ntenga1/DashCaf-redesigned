import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserType {
  CONTROL = 'CONTROL',
  CUSTOMER = 'CUSTOMER',
  STORE = 'STORE',
  STORE_STAFF = 'STORE_STAFF',
  DELIVERY = 'DELIVERY',
}

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: UserType })
  userType: UserType;

  @Column()
  tokenHash: string;

  @Column({ nullable: true })
  fingerprintHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date;

  /**
   * Hard session ceiling — set once at login and carried forward unchanged on
   * every token rotation. When this timestamp passes the session is dead even
   * if the refresh token itself is still within its 7-day window.
   * Mirrors the 8-hour ceiling from the HSIMP-FRESH security architecture.
   */
  @Column({ type: 'timestamptz', nullable: true })
  sessionExpiresAt: Date;
}
