import { Body, Controller, Get, Param, Patch, Post, Query, SetMetadata } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoreStaffService } from '../store-staff/store-staff.service';
import { RegisterStoreDto } from './dto/register-store.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const Public = () => SetMetadata('isPublic', true);

@Controller('stores')
export class StoresController {
  constructor(
    private readonly service: StoresService,
    private readonly staffService: StoreStaffService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterStoreDto) {
    return this.service.register(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  @Public()
  @Get('search')
  search(@Query('q') q: string) {
    return this.service.search(q);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  // Must be before :id to avoid being swallowed as a param
  @Get('me')
  async me(@CurrentUser() user: any) {
    if (user.userType === 'STORE_STAFF') {
      const staff = await this.staffService.findById(user.sub);
      const store = await this.service.findBySlug(user.storeSlug);
      return {
        user: {
          id: user.sub,
          email: user.email,
          name: staff?.name ?? user.name,
          role: user.role,
          userType: 'STORE_STAFF',
          storeSlug: user.storeSlug,
        },
        store,
      };
    }

    const store = await this.service.findOne(user.sub);
    return {
      user: {
        id: user.sub,
        email: user.email,
        name: store.ownerName,
        role: 'OWNER',
        userType: 'STORE',
      },
      store,
    };
  }

  @Roles('SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Get('pending')
  findPending() {
    return this.service.findPending();
  }

  @Roles('SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.approve(id, { id: user.sub, email: user.email, role: user.role });
  }

  @Roles('SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.service.reject(id, reason, { id: user.sub, email: user.email, role: user.role });
  }

  @Roles('SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Patch(':id/suspend')
  suspend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.suspend(id, { id: user.sub, email: user.email, role: user.role });
  }

  @Roles('SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.reactivate(id, { id: user.sub, email: user.email, role: user.role });
  }
}
