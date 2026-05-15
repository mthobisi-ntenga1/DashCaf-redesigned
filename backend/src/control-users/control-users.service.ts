import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ControlUser, ControlRole } from './control-user.entity';
import { CreateControlUserDto } from './dto/create-control-user.dto';
import { AuditLogService, AuditActor } from '../audit-logs/audit-log.service';

@Injectable()
export class ControlUsersService {
  constructor(
    @InjectRepository(ControlUser)
    private readonly repo: Repository<ControlUser>,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateControlUserDto, actor: AuditActor): Promise<ControlUser> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use.');

    const creator = await this.repo.findOne({ where: { id: actor.id } });
    if (!creator) throw new NotFoundException('Creator not found.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({ ...dto, passwordHash, createdBy: creator });
    const saved = await this.repo.save(user);

    this.auditLog.log({ actor, action: 'ADMIN_CREATED', targetType: 'ControlUser', targetId: saved.id, metadata: { email: dto.email, role: dto.role } });

    return saved;
  }

  async findAll(): Promise<ControlUser[]> {
    return this.repo.find({ relations: ['createdBy'] });
  }

  async findOne(id: string): Promise<ControlUser> {
    const user = await this.repo.findOne({ where: { id }, relations: ['createdBy'] });
    if (!user) throw new NotFoundException('Admin not found.');
    return user;
  }

  async update(id: string, updates: Partial<ControlUser>): Promise<ControlUser> {
    const user = await this.findOne(id);
    Object.assign(user, updates);
    return this.repo.save(user);
  }

  async suspend(id: string, reason: string, actorRole: ControlRole, actor: AuditActor): Promise<ControlUser> {
    const user = await this.findOne(id);
    if (user.role === ControlRole.CHIEF_ADMIN)
      throw new ForbiddenException('Cannot suspend Chief Admin.');
    user.isSuspended = true;
    user.suspendedReason = reason;
    const saved = await this.repo.save(user);

    this.auditLog.log({ actor, action: 'ADMIN_SUSPENDED', targetType: 'ControlUser', targetId: id, metadata: { email: user.email, reason } });

    return saved;
  }

  async reactivate(id: string, actor: AuditActor): Promise<ControlUser> {
    const user = await this.findOne(id);
    user.isSuspended = false;
    user.suspendedReason = null;
    const saved = await this.repo.save(user);

    this.auditLog.log({ actor, action: 'ADMIN_REACTIVATED', targetType: 'ControlUser', targetId: id, metadata: { email: user.email } });

    return saved;
  }

  async remove(id: string, actor: AuditActor): Promise<void> {
    const user = await this.findOne(id);
    if (user.role === ControlRole.CHIEF_ADMIN)
      throw new ForbiddenException('Cannot delete Chief Admin.');
    await this.repo.remove(user);

    this.auditLog.log({ actor, action: 'ADMIN_DELETED', targetType: 'ControlUser', targetId: id, metadata: { email: user.email } });
  }

  async seedChiefAdmin() {
    const existing = await this.repo.findOne({
      where: { role: ControlRole.CHIEF_ADMIN },
    });
    if (existing) return;

    const passwordHash = await bcrypt.hash('DashCaf@Admin1', 12);
    await this.repo.save(
      this.repo.create({
        email: 'chief@dashcaf.com',
        name: 'Chief Admin',
        role: ControlRole.CHIEF_ADMIN,
        passwordHash,
        isActive: true,
      }),
    );
    console.log('Chief admin seeded: chief@dashcaf.com / DashCaf@Admin1');
  }
}
