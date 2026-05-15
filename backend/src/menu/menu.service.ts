import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from './menu-category.entity';
import { MenuItem } from './menu-item.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly catRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
  ) {}

  async getMenu(storeSlug: string): Promise<MenuCategory[]> {
    return this.catRepo.find({
      where: { storeSlug },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async addCategory(storeSlug: string, name: string): Promise<MenuCategory> {
    const cat = this.catRepo.create({ storeSlug, name });
    return this.catRepo.save(cat);
  }

  async addItem(storeSlug: string, dto: {
    categoryId: string;
    name: string;
    description?: string;
    basePrice: number;
  }): Promise<MenuItem> {
    const category = await this.catRepo.findOne({
      where: { id: dto.categoryId, storeSlug },
    });
    if (!category) throw new NotFoundException('Category not found.');

    const displayPrice = Number(dto.basePrice); // no markup by default
    const item = this.itemRepo.create({
      ...dto,
      displayPrice,
    });
    return this.itemRepo.save(item);
  }

  async updateItem(itemId: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found.');
    Object.assign(item, updates);
    return this.itemRepo.save(item);
  }

  async findItemById(itemId: string): Promise<MenuItem | null> {
    return this.itemRepo.findOne({ where: { id: itemId } });
  }
}
