import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { DeliveryUser, DeliveryUserStatus } from './delivery-user.entity';
import { RegisterDeliveryUserDto } from './dto/register-delivery-user.dto';
import { AuditLogService, AuditActor } from '../audit-logs/audit-log.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class DeliveryUsersService {
  constructor(
    @InjectRepository(DeliveryUser)
    private readonly repo: Repository<DeliveryUser>,
    private readonly auditLog: AuditLogService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDeliveryUserDto): Promise<Omit<DeliveryUser, 'passwordHash'>> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({ ...dto, passwordHash });
    const saved = await this.repo.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async findAll(): Promise<DeliveryUser[]> {
    return this.repo.find();
  }

  async findPending(): Promise<DeliveryUser[]> {
    return this.repo.find({ where: { status: DeliveryUserStatus.PENDING } });
  }

  async findOne(id: string): Promise<DeliveryUser> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Delivery worker not found.');
    return user;
  }

  async update(id: string, updates: Partial<DeliveryUser>): Promise<DeliveryUser> {
    const user = await this.findOne(id);
    Object.assign(user, updates);
    return this.repo.save(user);
  }

  async approve(id: string, actor: AuditActor): Promise<DeliveryUser> {
    const user = await this.findOne(id);
    user.status = DeliveryUserStatus.ACTIVE;
    user.rejectionReason = null;
    const saved = await this.repo.save(user);

    this.auditLog.log({ actor, action: 'DELIVERY_APPROVED', targetType: 'DeliveryUser', targetId: id, metadata: { email: user.email } });
    this.email.deliveryApproved(user.email, user.name);

    return saved;
  }

  async reject(id: string, reason: string, actor: AuditActor): Promise<DeliveryUser> {
    const user = await this.findOne(id);
    user.status = DeliveryUserStatus.PENDING;
    user.rejectionReason = reason;
    const saved = await this.repo.save(user);

    this.auditLog.log({ actor, action: 'DELIVERY_REJECTED', targetType: 'DeliveryUser', targetId: id, metadata: { email: user.email, reason } });
    this.email.deliveryRejected(user.email, user.name, reason);

    return saved;
  }

  async suspend(id: string, actor: AuditActor): Promise<DeliveryUser> {
    const user = await this.findOne(id);
    user.status = DeliveryUserStatus.SUSPENDED;
    const saved = await this.repo.save(user);

    this.auditLog.log({ actor, action: 'DELIVERY_SUSPENDED', targetType: 'DeliveryUser', targetId: id, metadata: { email: user.email } });

    return saved;
  }

  async reactivate(id: string, actor: AuditActor): Promise<DeliveryUser> {
    const user = await this.findOne(id);
    user.status = DeliveryUserStatus.ACTIVE;
    const saved = await this.repo.save(user);

    this.auditLog.log({ actor, action: 'DELIVERY_REACTIVATED', targetType: 'DeliveryUser', targetId: id, metadata: { email: user.email } });

    return saved;
  }

  async addEarnings(id: string, amount: number): Promise<DeliveryUser> {
    const user = await this.findOne(id);
    user.totalEarned = Number(user.totalEarned) + amount;
    return this.repo.save(user);
  }

  async setGoal(id: string, goal: number): Promise<DeliveryUser> {
    const user = await this.findOne(id);
    user.deliveryGoal = goal;
    return this.repo.save(user);
  }
}
