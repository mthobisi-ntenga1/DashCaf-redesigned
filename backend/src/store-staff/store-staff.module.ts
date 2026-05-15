import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreStaff } from './store-staff.entity';
import { StoreStaffService } from './store-staff.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreStaff])],
  providers: [StoreStaffService],
  exports: [StoreStaffService],
})
export class StoreStaffModule {}
