import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  SetMetadata,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { StoreStaffService } from '../store-staff/store-staff.service';
import { CreateStaffDto } from '../store-staff/dto/create-staff.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const Public = () => SetMetadata('isPublic', true);

@Controller('stores')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly staffService: StoreStaffService,
  ) {}

  // ── Menu ─────────────────────────────────────────────────────────────────

  @Public()
  @Get(':slug/menu')
  getMenu(@Param('slug') slug: string) {
    return this.menuService.getMenu(slug);
  }

  @Post(':slug/menu/categories')
  addCategory(@Param('slug') slug: string, @Body('name') name: string) {
    return this.menuService.addCategory(slug, name);
  }

  @Post(':slug/menu/items')
  addItem(@Param('slug') slug: string, @Body() dto: any) {
    return this.menuService.addItem(slug, {
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description,
      basePrice: Number(dto.basePrice),
    });
  }

  @Patch(':slug/menu/items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() updates: any) {
    return this.menuService.updateItem(itemId, updates);
  }

  // ── Staff management (admin) ──────────────────────────────────────────────

  @Get(':slug/staff')
  getStaff(@Param('slug') slug: string) {
    return this.staffService.findByStore(slug);
  }

  @Post(':slug/staff')
  createStaff(@Param('slug') slug: string, @Body() dto: CreateStaffDto) {
    return this.staffService.create(slug, dto);
  }

  @Patch(':slug/staff/:id/suspend')
  suspendStaff(@Param('slug') slug: string, @Param('id') id: string) {
    return this.staffService.suspend(slug, id);
  }

  @Patch(':slug/staff/:id/reactivate')
  reactivateStaff(@Param('slug') slug: string, @Param('id') id: string) {
    return this.staffService.reactivate(slug, id);
  }

  @Patch(':slug/staff/:id/reset-pin')
  resetPin(@Param('slug') slug: string, @Param('id') id: string, @Body('pin') pin: string) {
    return this.staffService.resetPin(slug, id, pin);
  }

  // ── Worker self-service (STORE_STAFF JWT) ─────────────────────────────────

  @Get(':slug/staff/me')
  getMyProfile(@CurrentUser('sub') staffId: string) {
    return this.staffService.getProfile(staffId);
  }

  @Patch(':slug/staff/me/set-pin')
  setMyPin(@CurrentUser('sub') staffId: string, @Body('pin') pin: string) {
    return this.staffService.setPin(staffId, pin);
  }

  // ── Station PIN check-in (shared screen) ──────────────────────────────────

  @Post(':slug/stations/verify-pin')
  verifyPin(@Param('slug') slug: string, @Body('pin') pin: string) {
    return this.staffService.verifyPin(slug, pin);
  }
}
