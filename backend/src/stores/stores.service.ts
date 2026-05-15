import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Store, StoreStatus } from './store.entity';
import { StoreProvisioning } from './store-provisioning.entity';
import { RegisterStoreDto } from './dto/register-store.dto';
import { StoreDbService } from '../database/store-db.service';
import { AuditLogService, AuditActor } from '../audit-logs/audit-log.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreProvisioning)
    private readonly provisioningRepo: Repository<StoreProvisioning>,
    private readonly storeDbService: StoreDbService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterStoreDto): Promise<Store> {
    const slugTaken = await this.storeRepo.findOne({ where: { slug: dto.slug } });
    if (slugTaken) throw new ConflictException('This slug is already taken.');

    const emailTaken = await this.storeRepo.findOne({ where: { ownerEmail: dto.ownerEmail } });
    if (emailTaken) throw new ConflictException('Email already registered.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const store = this.storeRepo.create({ ...dto, passwordHash });
    return this.storeRepo.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storeRepo.find();
  }

  async findActive(): Promise<Store[]> {
    return this.storeRepo.find({ where: { status: StoreStatus.ACTIVE } });
  }

  async findPending(): Promise<Store[]> {
    return this.storeRepo.find({ where: { status: StoreStatus.PENDING } });
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new NotFoundException('Store not found.');
    return store;
  }

  async findBySlug(slug: string): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { slug } });
    if (!store) throw new NotFoundException('Store not found.');
    return store;
  }

  async search(q: string): Promise<Store[]> {
    if (!q?.trim()) return this.findActive();
    return this.storeRepo.find({
      where: [
        { status: StoreStatus.ACTIVE, name: ILike(`%${q}%`) },
        { status: StoreStatus.ACTIVE, slug: ILike(`%${q}%`) },
      ],
      order: { name: 'ASC' },
    });
  }

  async approve(id: string, actor: AuditActor): Promise<Store> {
    const store = await this.findOne(id);
    store.status = StoreStatus.ACTIVE;
    await this.storeRepo.save(store);
    await this.provisionStoreDatabase(store);

    this.auditLog.log({ actor, action: 'STORE_APPROVED', targetType: 'Store', targetId: id, metadata: { storeName: store.name } });
    this.email.storeApproved(store.ownerEmail, store.name);

    return store;
  }

  async reject(id: string, reason: string, actor: AuditActor): Promise<Store> {
    const store = await this.findOne(id);
    store.status = StoreStatus.REJECTED;
    store.rejectionReason = reason;
    const saved = await this.storeRepo.save(store);

    this.auditLog.log({ actor, action: 'STORE_REJECTED', targetType: 'Store', targetId: id, metadata: { storeName: store.name, reason } });
    this.email.storeRejected(store.ownerEmail, store.name, reason);

    return saved;
  }

  async suspend(id: string, actor: AuditActor): Promise<Store> {
    const store = await this.findOne(id);
    store.status = StoreStatus.SUSPENDED;
    const saved = await this.storeRepo.save(store);

    this.auditLog.log({ actor, action: 'STORE_SUSPENDED', targetType: 'Store', targetId: id, metadata: { storeName: store.name } });

    return saved;
  }

  async reactivate(id: string, actor: AuditActor): Promise<Store> {
    const store = await this.findOne(id);
    store.status = StoreStatus.ACTIVE;
    const saved = await this.storeRepo.save(store);

    this.auditLog.log({ actor, action: 'STORE_REACTIVATED', targetType: 'Store', targetId: id, metadata: { storeName: store.name } });

    return saved;
  }

  private async provisionStoreDatabase(store: Store) {
    const dbName = `dashcaf_${store.slug.replace(/-/g, '_')}`;
    const provisioning = this.provisioningRepo.create({
      storeId: store.id,
      store,
      dbHost: this.config.get('DB_HOST', 'localhost'),
      dbPort: this.config.get<number>('DB_PORT', 5432),
      dbName,
      dbUser: this.config.get('DB_USER', 'postgres'),
      dbPassword: this.config.get('DB_PASS', 'postgres'),
      provisionedAt: new Date(),
    });
    await this.provisioningRepo.save(provisioning);
    console.log(`Store DB provisioned: ${dbName}`);
  }
}
