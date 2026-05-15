import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly repo: Repository<Location>,
  ) {}

  async create(dto: CreateLocationDto, createdBy: string): Promise<Location> {
    const loc = this.repo.create({ ...dto, createdBy });
    return this.repo.save(loc);
  }

  async findAll(activeOnly = false): Promise<Location[]> {
    return activeOnly
      ? this.repo.find({ where: { isActive: true } })
      : this.repo.find();
  }

  async findOne(id: string): Promise<Location> {
    const loc = await this.repo.findOne({ where: { id } });
    if (!loc) throw new NotFoundException('Location not found.');
    return loc;
  }

  async update(id: string, updates: Partial<Location>): Promise<Location> {
    const loc = await this.findOne(id);
    Object.assign(loc, updates);
    return this.repo.save(loc);
  }

  async deactivate(id: string): Promise<Location> {
    const loc = await this.findOne(id);
    loc.isActive = false;
    return this.repo.save(loc);
  }

  async activate(id: string): Promise<Location> {
    const loc = await this.findOne(id);
    loc.isActive = true;
    return this.repo.save(loc);
  }
}
