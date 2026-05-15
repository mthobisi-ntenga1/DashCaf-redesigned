import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategory } from './menu-category.entity';
import { MenuItem } from './menu-item.entity';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { StoreStaffModule } from '../store-staff/store-staff.module';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory, MenuItem]), StoreStaffModule],
  providers: [MenuService],
  controllers: [MenuController],
  exports: [MenuService, TypeOrmModule],
})
export class MenuModule {}
