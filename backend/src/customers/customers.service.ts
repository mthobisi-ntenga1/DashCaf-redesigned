import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer, CustomerStatus } from './customer.entity';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { AuditLogService, AuditActor } from '../audit-logs/audit-log.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly auditLog: AuditLogService,
  ) {}

  async register(dto: RegisterCustomerDto): Promise<Omit<Customer, 'passwordHash'>> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const customer = this.repo.create({ ...dto, passwordHash });
    const saved = await this.repo.save(customer);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async findAll(): Promise<Customer[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found.');
    return customer;
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updates);
    return this.repo.save(customer);
  }

  async suspend(id: string, actor: AuditActor): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.status = CustomerStatus.SUSPENDED;
    const saved = await this.repo.save(customer);

    this.auditLog.log({ actor, action: 'CUSTOMER_SUSPENDED', targetType: 'Customer', targetId: id, metadata: { email: customer.email } });

    return saved;
  }

  async reactivate(id: string, actor: AuditActor): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.status = CustomerStatus.ACTIVE;
    const saved = await this.repo.save(customer);

    this.auditLog.log({ actor, action: 'CUSTOMER_REACTIVATED', targetType: 'Customer', targetId: id, metadata: { email: customer.email } });

    return saved;
  }
}
