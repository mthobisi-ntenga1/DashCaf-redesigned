import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../common/entities/audit-log.entity';

export interface AuditActor {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(data: {
    actor: AuditActor;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          actorId: data.actor.id,
          actorEmail: data.actor.email,
          actorRole: data.actor.role,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          metadata: data.metadata,
        }),
      );
    } catch {
      // audit logging must never crash the main flow
    }
  }

  async findAll(
    limit = 100,
    offset = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { logs, total };
  }
}
