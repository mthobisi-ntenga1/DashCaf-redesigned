import { Controller, Get } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('earnings')
export class EarningsController {
  constructor(private readonly service: EarningsService) {}

  @Get('me')
  getMyStats(@CurrentUser('sub') id: string) {
    return this.service.getStats(id);
  }
}
