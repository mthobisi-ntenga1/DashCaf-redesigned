import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { StoreStaff, StaffStatus } from './store-staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StoreStaffService {
  constructor(
    @InjectRepository(StoreStaff)
    private readonly repo: Repository<StoreStaff>,
  ) {}

  async create(storeSlug: string, dto: CreateStaffDto): Promise<Omit<StoreStaff, 'passwordHash' | 'pin'>> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const staff = this.repo.create({ storeSlug, ...dto, passwordHash });
    const saved = await this.repo.save(staff);
    const { passwordHash: _p, pin: _pin, ...result } = saved as any;
    return result;
  }

  async findByStore(storeSlug: string): Promise<StoreStaff[]> {
    return this.repo.find({
      where: { storeSlug },
      order: { createdAt: 'ASC' },
    });
  }

  async findById(id: string): Promise<StoreStaff | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<StoreStaff | null> {
    return this.repo.findOne({
      where: { email },
      select: ['id', 'storeSlug', 'name', 'email', 'passwordHash', 'role', 'status'],
    });
  }

  async getProfile(id: string): Promise<StoreStaff> {
    const staff = await this.repo.findOne({ where: { id } });
    if (!staff) throw new NotFoundException('Staff member not found.');
    return staff;
  }

  async setPin(staffId: string, pin: string): Promise<void> {
    if (!/^\d{4,6}$/.test(pin)) throw new BadRequestException('PIN must be 4–6 digits.');

    // Check uniqueness within the store
    const staff = await this.repo.findOne({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff member not found.');

    const allStaff = await this.repo.find({
      where: { storeSlug: staff.storeSlug },
      select: ['id', 'pin'],
    });
    for (const s of allStaff) {
      if (s.id !== staffId && s.pin) {
        const match = await bcrypt.compare(pin, s.pin);
        if (match) throw new ConflictException('This PIN is already in use by another team member. Choose a different one.');
      }
    }

    const hashed = await bcrypt.hash(pin, 10);
    await this.repo.update(staffId, { pin: hashed, pinSetAt: new Date() });
  }

  async resetPin(storeSlug: string, staffId: string, pin: string): Promise<void> {
    const staff = await this.repo.findOne({ where: { id: staffId, storeSlug } });
    if (!staff) throw new NotFoundException('Staff member not found.');
    await this.setPin(staffId, pin);
  }

  async verifyPin(storeSlug: string, pin: string): Promise<{ id: string; name: string; role: string }> {
    const allStaff = await this.repo.find({
      where: { storeSlug, status: StaffStatus.ACTIVE },
      select: ['id', 'name', 'role', 'pin'],
    });

    for (const s of allStaff) {
      if (!s.pin) continue;
      const match = await bcrypt.compare(pin, s.pin);
      if (match) return { id: s.id, name: s.name, role: s.role };
    }

    throw new UnauthorizedException('Incorrect PIN.');
  }

  async suspend(storeSlug: string, id: string): Promise<StoreStaff> {
    const staff = await this.repo.findOne({ where: { id, storeSlug } });
    if (!staff) throw new NotFoundException('Staff member not found.');
    staff.status = StaffStatus.SUSPENDED;
    return this.repo.save(staff);
  }

  async reactivate(storeSlug: string, id: string): Promise<StoreStaff> {
    const staff = await this.repo.findOne({ where: { id, storeSlug } });
    if (!staff) throw new NotFoundException('Staff member not found.');
    staff.status = StaffStatus.ACTIVE;
    return this.repo.save(staff);
  }
}
