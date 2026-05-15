import { Body, Controller, Get, Param, Patch, Post, SetMetadata } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const Public = () => SetMetadata('isPublic', true);

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterCustomerDto) {
    return this.service.register(dto);
  }

  @Get('me')
  me(@CurrentUser('sub') id: string) {
    return this.service.findOne(id);
  }

  @Patch('me')
  updateMe(@CurrentUser('sub') id: string, @Body() updates: any) {
    const safe = { name: updates.name, phone: updates.phone };
    return this.service.update(id, safe);
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
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
