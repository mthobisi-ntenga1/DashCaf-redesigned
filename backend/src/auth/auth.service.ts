import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RefreshToken, UserType } from '../common/entities/refresh-token.entity';
import { ControlUser } from '../control-users/control-user.entity';
import { Customer } from '../customers/customer.entity';
import { DeliveryUser } from '../delivery-users/delivery-user.entity';
import { Store } from '../stores/store.entity';
import { StoreStaff } from '../store-staff/store-staff.entity';
import { AuditLogService } from '../audit-logs/audit-log.service';

/** 8-hour hard session ceiling — matches HSIMP-FRESH security architecture */
const SESSION_CEILING_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private readonly auditLog: AuditLogService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(ControlUser)
    private controlUserRepo: Repository<ControlUser>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(DeliveryUser)
    private deliveryUserRepo: Repository<DeliveryUser>,
    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
    @InjectRepository(StoreStaff)
    private storeStaffRepo: Repository<StoreStaff>,
  ) {}

  fingerprint(ip: string, userAgent: string): string {
    return crypto
      .createHash('sha256')
      .update(`${ip}:${userAgent}`)
      .digest('hex');
  }

  async loginControl(email: string, password: string, ip: string, ua: string) {
    const user = await this.controlUserRepo.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'name', 'isActive', 'isSuspended'],
    });

    if (!user) {
      await this.auditLog.log({
        actor: { id: 'unknown', email, role: 'CONTROL' },
        action: 'AUTH_FAILED',
        targetType: 'ControlUser',
        metadata: { reason: 'user_not_found', ip },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive || user.isSuspended) {
      await this.auditLog.log({
        actor: { id: user.id, email, role: user.role },
        action: 'AUTH_FAILED',
        targetType: 'ControlUser',
        targetId: user.id,
        metadata: { reason: 'account_suspended', ip },
      });
      throw new ForbiddenException('Account suspended or inactive.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.auditLog.log({
        actor: { id: user.id, email, role: user.role },
        action: 'AUTH_FAILED',
        targetType: 'ControlUser',
        targetId: user.id,
        metadata: { reason: 'bad_password', ip },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(
      { sub: user.id, email: user.email, role: user.role, userType: UserType.CONTROL },
      UserType.CONTROL,
      ip,
      ua,
    );
  }

  async loginCustomer(email: string, password: string, ip: string, ua: string) {
    const user = await this.customerRepo.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'name', 'status'],
    });

    if (!user) {
      await this.auditLog.log({
        actor: { id: 'unknown', email, role: 'CUSTOMER' },
        action: 'AUTH_FAILED',
        targetType: 'Customer',
        metadata: { reason: 'user_not_found', ip },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status !== 'ACTIVE') {
      await this.auditLog.log({
        actor: { id: user.id, email, role: 'CUSTOMER' },
        action: 'AUTH_FAILED',
        targetType: 'Customer',
        targetId: user.id,
        metadata: { reason: 'account_suspended', ip },
      });
      throw new ForbiddenException('Account suspended.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.auditLog.log({
        actor: { id: user.id, email, role: 'CUSTOMER' },
        action: 'AUTH_FAILED',
        targetType: 'Customer',
        targetId: user.id,
        metadata: { reason: 'bad_password', ip },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(
      { sub: user.id, email: user.email, name: user.name, userType: UserType.CUSTOMER },
      UserType.CUSTOMER,
      ip,
      ua,
    );
  }

  async loginDelivery(email: string, password: string, ip: string, ua: string) {
    const user = await this.deliveryUserRepo.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'name', 'status'],
    });

    if (!user) {
      await this.auditLog.log({
        actor: { id: 'unknown', email, role: 'DELIVERY' },
        action: 'AUTH_FAILED',
        targetType: 'DeliveryUser',
        metadata: { reason: 'user_not_found', ip },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status !== 'ACTIVE') {
      await this.auditLog.log({
        actor: { id: user.id, email, role: 'DELIVERY' },
        action: 'AUTH_FAILED',
        targetType: 'DeliveryUser',
        targetId: user.id,
        metadata: { reason: 'account_suspended', ip },
      });
      throw new ForbiddenException('Account not yet approved or suspended.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.auditLog.log({
        actor: { id: user.id, email, role: 'DELIVERY' },
        action: 'AUTH_FAILED',
        targetType: 'DeliveryUser',
        targetId: user.id,
        metadata: { reason: 'bad_password', ip },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(
      { sub: user.id, email: user.email, name: user.name, userType: UserType.DELIVERY },
      UserType.DELIVERY,
      ip,
      ua,
    );
  }

  async loginStore(email: string, password: string, ip: string, ua: string) {
    // 1. Try store owner first
    const store = await this.storeRepo.findOne({
      where: { ownerEmail: email },
      select: ['id', 'ownerEmail', 'passwordHash', 'slug', 'name', 'status'],
    });

    if (store) {
      if (store.status !== 'ACTIVE') {
        await this.auditLog.log({
          actor: { id: store.id, email, role: 'STORE' },
          action: 'AUTH_FAILED',
          targetType: 'Store',
          targetId: store.id,
          metadata: { reason: 'store_not_active', ip },
        });
        throw new ForbiddenException('Store not active.');
      }
      const valid = await bcrypt.compare(password, store.passwordHash);
      if (!valid) {
        await this.auditLog.log({
          actor: { id: store.id, email, role: 'STORE' },
          action: 'AUTH_FAILED',
          targetType: 'Store',
          targetId: store.id,
          metadata: { reason: 'bad_password', ip },
        });
        throw new UnauthorizedException('Invalid credentials.');
      }
      return this.issueTokens(
        { sub: store.id, email: store.ownerEmail, slug: store.slug, name: store.name, userType: UserType.STORE },
        UserType.STORE,
        ip,
        ua,
      );
    }

    // 2. Try store staff
    const staff = await this.storeStaffRepo.findOne({
      where: { email },
      select: ['id', 'storeSlug', 'name', 'email', 'passwordHash', 'role', 'status'],
    });

    if (!staff) {
      await this.auditLog.log({
        actor: { id: 'unknown', email, role: 'STORE_STAFF' },
        action: 'AUTH_FAILED',
        targetType: 'StoreStaff',
        metadata: { reason: 'user_not_found', ip },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (staff.status !== 'ACTIVE') {
      await this.auditLog.log({
        actor: { id: staff.id, email, role: staff.role },
        action: 'AUTH_FAILED',
        targetType: 'StoreStaff',
        targetId: staff.id,
        metadata: { reason: 'account_suspended', ip },
      });
      throw new ForbiddenException('Account suspended.');
    }

    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) {
      await this.auditLog.log({
        actor: { id: staff.id, email, role: staff.role },
        action: 'AUTH_FAILED',
        targetType: 'StoreStaff',
        targetId: staff.id,
        metadata: { reason: 'bad_password', ip },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(
      {
        sub: staff.id,
        email: staff.email,
        name: staff.name,
        storeSlug: staff.storeSlug,
        role: staff.role,
        userType: UserType.STORE_STAFF,
      },
      UserType.STORE_STAFF,
      ip,
      ua,
    );
  }

  async refreshTokens(refreshToken: string, ip: string, ua: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.refreshTokenRepo.findOne({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.usedAt) {
      if (stored && !stored.revokedAt) {
        await this.revokeAllForUser(stored.userId, stored.userType);
      }
      await this.auditLog.log({
        actor: { id: stored?.userId ?? 'unknown', email: payload?.email ?? 'unknown', role: payload?.role ?? payload?.userType ?? 'unknown' },
        action: 'TOKEN_REPLAY_DETECTED',
        targetType: 'RefreshToken',
        targetId: stored?.id,
        metadata: { ip, userType: stored?.userType },
      });
      throw new UnauthorizedException('Refresh token reuse detected.');
    }

    // 8-hour hard session ceiling check
    if (stored.sessionExpiresAt && new Date() > stored.sessionExpiresAt) {
      await this.revokeAllForUser(stored.userId, stored.userType);
      await this.auditLog.log({
        actor: { id: stored.userId, email: payload?.email ?? 'unknown', role: payload?.userType ?? 'unknown' },
        action: 'SESSION_CEILING_EXCEEDED',
        targetType: 'RefreshToken',
        targetId: stored.id,
        metadata: { ip, sessionExpiresAt: stored.sessionExpiresAt },
      });
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    const fp = this.fingerprint(ip, ua);
    if (stored.fingerprintHash && stored.fingerprintHash !== fp) {
      await this.revokeAllForUser(stored.userId, stored.userType);
      await this.auditLog.log({
        actor: { id: stored.userId, email: payload?.email ?? 'unknown', role: payload?.userType ?? 'unknown' },
        action: 'AUTH_FINGERPRINT_MISMATCH',
        targetType: 'RefreshToken',
        targetId: stored.id,
        metadata: { ip, expectedFp: stored.fingerprintHash?.slice(0, 8) + '…', actualFp: fp.slice(0, 8) + '…' },
      });
      throw new UnauthorizedException('Device mismatch — all sessions revoked.');
    }

    stored.usedAt = new Date();
    await this.refreshTokenRepo.save(stored);

    const { iat, exp, ...claims } = payload;
    // Carry the original sessionExpiresAt forward — it never resets on rotation
    return this.issueTokens(claims, stored.userType, ip, ua, stored.sessionExpiresAt);
  }

  async logout(userId: string) {
    await this.refreshTokenRepo.update({ userId }, { revokedAt: new Date() });
  }

  private async issueTokens(
    payload: Record<string, any>,
    userType: UserType,
    ip: string,
    ua: string,
    /** Carry forward the existing session ceiling (rotation) or omit to start a new 8-hour window (login) */
    existingSessionExpiresAt?: Date,
  ) {
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
    });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const fp = this.fingerprint(ip, ua);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // On first login: start the 8-hour ceiling. On rotation: carry it forward unchanged.
    const sessionExpiresAt = existingSessionExpiresAt ?? new Date(Date.now() + SESSION_CEILING_MS);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: payload.sub,
        userType,
        tokenHash,
        fingerprintHash: fp,
        expiresAt,
        sessionExpiresAt,
      }),
    );

    return { accessToken, refreshToken };
  }

  private async revokeAllForUser(userId: string, userType: UserType) {
    await this.refreshTokenRepo.update(
      { userId, userType },
      { revokedAt: new Date() },
    );
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }

  async changePassword(
    userId: string,
    userType: UserType,
    currentPassword: string,
    newPassword: string,
  ) {
    let repo: any;
    if (userType === UserType.CONTROL) repo = this.controlUserRepo;
    else if (userType === UserType.CUSTOMER) repo = this.customerRepo;
    else if (userType === UserType.DELIVERY) repo = this.deliveryUserRepo;
    else if (userType === UserType.STORE_STAFF) repo = this.storeStaffRepo;
    else throw new UnauthorizedException('Password change not supported for this account type.');

    const user = await repo.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password incorrect.');

    user.passwordHash = await this.hashPassword(newPassword);
    await repo.save(user);
  }
}
