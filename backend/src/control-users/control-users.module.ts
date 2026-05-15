import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlUser } from './control-user.entity';
import { ControlUsersService } from './control-users.service';
import { ControlUsersController } from './control-users.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([ControlUser]), AuditLogsModule],
  providers: [ControlUsersService],
  controllers: [ControlUsersController],
  exports: [ControlUsersService],
})
export class ControlUsersModule {}
