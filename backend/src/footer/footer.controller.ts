import { Body, Controller, Get, Patch, SetMetadata } from '@nestjs/common';
import { FooterService } from './footer.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const Public = () => SetMetadata('isPublic', true);

@Controller('footer')
export class FooterController {
  constructor(private readonly service: FooterService) {}

  @Public()
  @Get('config')
  getConfig() {
    return this.service.getConfig();
  }

  @Roles('SENIOR_ADMIN', 'CHIEF_ADMIN')
  @Patch('config')
  updateConfig(@Body() updates: any, @CurrentUser('sub') id: string) {
    return this.service.updateConfig(updates, id);
  }

  @Public()
  @Get('fees')
  getFees() {
    return this.service.getFeeConfig();
  }
}
