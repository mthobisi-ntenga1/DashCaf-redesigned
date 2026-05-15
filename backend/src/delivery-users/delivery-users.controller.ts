import { Body, Controller, Get, Param, Patch, Post, SetMetadata } from '@nestjs/common';
import { DeliveryUsersService } from './delivery-users.service';
import { RegisterDeliveryUserDto } from './dto/register-delivery-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const Public = () => SetMetadata('isPublic', true);

@Controller('delivery-users')
export class DeliveryUsersController {
  constructor(private readonly service: DeliveryUsersService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDeliveryUserDto) {
    return this.service.register(dto);
  }

  @Get('me')
  me(@CurrentUser('sub') id: string) {
    return this.service.findOne(id);
  }

  @Patch('me')
  updateMe(@CurrentUser('sub') id: string, @Body() updates: any) {
    const safe: any = {};
    if (updates.name !== undefined) safe.name = updates.name;
    if (updates.phone !== undefined) safe.phone = updates.phone;
    if (updates.deliveryGoal !== undefined) safe.deliveryGoal = Number(updates.deliveryGoal);
    return this.service.update(id, safe);
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Get('pending')
  findPending() {
    return this.service.findPending();
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.approve(id, { id: user.sub, email: user.email, role: user.role });
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.service.reject(id, reason, { id: user.sub, email: user.email, role: user.role });
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Patch(':id/suspend')
  suspend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.suspend(id, { id: user.sub, email: user.email, role: user.role });
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.reactivate(id, { id: user.sub, email: user.email, role: user.role });
  }
}
