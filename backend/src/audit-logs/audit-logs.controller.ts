import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogService) {}

  @Roles('CHIEF_ADMIN', 'SENIOR_ADMIN')
  @Get()
  findAll(
    @Query('limit') limit = '100',
    @Query('offset') offset = '0',
  ) {
    return this.service.findAll(Number(limit), Number(offset));
  }
}
