import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ControlUsersService } from './control-users.service';
import { CreateControlUserDto } from './dto/create-control-user.dto';

@Controller('control-users')
@Roles('CHIEF_ADMIN', 'SENIOR_ADMIN', 'ADMIN_OFFICER')
export class ControlUsersController {
  constructor(private readonly service: ControlUsersService) {}

  @Roles('CHIEF_ADMIN', 'SENIOR_ADMIN')
  @Post()
  create(@Body() dto: CreateControlUserDto, @CurrentUser() user: any) {
    return this.service.create(dto, { id: user.sub, email: user.email, role: user.role });
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('me')
  me(@CurrentUser() user: any) {
    return this.service.findOne(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('CHIEF_ADMIN', 'SENIOR_ADMIN')
  @Patch(':id/suspend')
  suspend(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.service.suspend(id, reason, user.role, { id: user.sub, email: user.email, role: user.role });
  }

  @Roles('CHIEF_ADMIN', 'SENIOR_ADMIN')
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.reactivate(id, { id: user.sub, email: user.email, role: user.role });
  }

  @Roles('CHIEF_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, { id: user.sub, email: user.email, role: user.role });
  }
}
