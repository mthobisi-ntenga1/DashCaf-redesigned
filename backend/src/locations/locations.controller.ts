import { Body, Controller, Get, Param, Patch, Post, Query, SetMetadata } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const Public = () => SetMetadata('isPublic', true);

@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Public()
  @Get()
  findAll(@Query('active') active: string) {
    return this.service.findAll(active === 'true');
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Post()
  create(@Body() dto: CreateLocationDto, @CurrentUser('sub') id: string) {
    return this.service.create(dto, id);
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updates: Partial<CreateLocationDto>) {
    return this.service.update(id, updates);
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Roles('ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }
}
