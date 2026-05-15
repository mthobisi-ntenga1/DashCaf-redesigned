import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SupportService } from './support.service';
import { SubmitterType } from './support-ticket.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    const submitterType = (user.userType || 'CUSTOMER') as SubmitterType;
    return this.service.create({ submittedBy: user.sub, submitterType, subject, message });
  }

  @Roles('CHIEF_ADMIN', 'SENIOR_ADMIN', 'ADMIN_OFFICER')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('CHIEF_ADMIN', 'SENIOR_ADMIN', 'ADMIN_OFFICER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('CHIEF_ADMIN')
  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body('assignedTo') assignedTo: string, @Body('note') note: string) {
    return this.service.assign(id, assignedTo, note);
  }

  @Roles('CHIEF_ADMIN', 'SENIOR_ADMIN', 'ADMIN_OFFICER')
  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.service.resolve(id);
  }
}
