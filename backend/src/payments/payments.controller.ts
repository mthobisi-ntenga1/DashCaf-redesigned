import {
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  SetMetadata,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Request } from 'express';

const Public = () => SetMetadata('isPublic', true);

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly service: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Called by the frontend when the customer is ready to pay.
   * Returns the PayFast form fields the frontend posts to PayFast.
   */
  @Post('initiate')
  async initiatePayment(
    @CurrentUser() user: any,
    @Body('orderId') orderId: string,
    @Body('returnUrl') returnUrl: string,
    @Body('cancelUrl') cancelUrl: string,
  ) {
    const notifyUrl = this.config.get<string>('PAYFAST_NOTIFY_URL') ??
      `${this.config.get('APP_URL', 'http://localhost:5000')}/api/payments/payfast/itn`;

    return this.service.initiatePayment({
      orderId,
      customerEmail: user.email,
      returnUrl,
      cancelUrl,
      notifyUrl,
    });
  }

  @Public()
  @Post('payfast/itn')
  async payfastItn(@Body() body: any, @Req() req: Request) {
    return this.service.handlePayfastItn(body, req);
  }
}
