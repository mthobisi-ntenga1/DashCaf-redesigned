import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Request } from 'express';
import { Order, OrderStatus } from '../orders/order.entity';
import { OrdersGateway } from '../orders/orders.gateway';
import { EmailService } from '../notifications/email.service';
import { Customer } from '../customers/customer.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly gateway: OrdersGateway,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generate a PayFast payload for a given order.
   * Called by the customer frontend just before redirecting to PayFast.
   */
  async initiatePayment(params: {
    orderId: string;
    customerEmail: string;
    returnUrl: string;
    cancelUrl: string;
    notifyUrl: string;
  }) {
    const order = await this.orderRepo.findOne({ where: { id: params.orderId } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in a payable state.');
    }

    const merchantId = this.config.get<string>('PAYFAST_MERCHANT_ID');
    const merchantKey = this.config.get<string>('PAYFAST_MERCHANT_KEY');
    const passphrase = this.config.get<string>('PAYFAST_PASSPHRASE');
    const sandbox = this.config.get<string>('PAYFAST_SANDBOX') !== 'false';

    if (!merchantId || !merchantKey) {
      throw new BadRequestException('PayFast is not configured on this server.');
    }

    const payload = this.generatePayfastPayload({
      merchantId,
      merchantKey,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
      notifyUrl: params.notifyUrl,
      email: params.customerEmail,
      amount: Number(order.total),
      itemName: `DashCaf order from ${order.storeName}`,
      orderId: order.id,
      passphrase,
    });

    const payfastUrl = sandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    return { payload, payfastUrl };
  }

  async handlePayfastItn(body: Record<string, string>, req: Request): Promise<{ status: string }> {
    const isValid = this.validateItnSignature(body);
    if (!isValid) {
      this.logger.warn('PayFast ITN signature validation failed');
      throw new BadRequestException('Invalid ITN signature.');
    }

    if (body.payment_status !== 'COMPLETE') {
      this.logger.log(`PayFast ITN received with status: ${body.payment_status}`);
      return { status: 'ignored' };
    }

    const orderId = body.m_payment_id;
    if (!orderId) {
      this.logger.warn('PayFast ITN missing m_payment_id');
      return { status: 'ignored' };
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`PayFast ITN: order ${orderId} not found`);
      return { status: 'ignored' };
    }

    if (order.status !== OrderStatus.PENDING) {
      this.logger.log(`PayFast ITN: order ${orderId} already past PENDING (${order.status}), skipping`);
      return { status: 'already_processed' };
    }

    // Payment verified — confirm the order
    order.status = OrderStatus.CONFIRMED;
    await this.orderRepo.save(order);
    this.logger.log(`PayFast ITN: order ${orderId} confirmed`);

    // Push live status update to customer and store
    this.gateway.server?.to(`customer:${order.customerId}`).emit('order_status_update', {
      orderId: order.id,
      status: OrderStatus.CONFIRMED,
    });
    this.gateway.server?.to(`store:${order.storeSlug}`).emit('order_status_update', {
      orderId: order.id,
      status: OrderStatus.CONFIRMED,
    });

    // Email confirmation
    const customer = await this.customerRepo.findOne({ where: { id: order.customerId } });
    if (customer) {
      this.emailService.orderConfirmed(customer.email, order.id, order.storeName, Number(order.total));
    }

    return { status: 'ok' };
  }

  generatePayfastPayload(params: {
    merchantId: string;
    merchantKey: string;
    returnUrl: string;
    cancelUrl: string;
    notifyUrl: string;
    email: string;
    amount: number;
    itemName: string;
    orderId: string;
    passphrase?: string;
  }) {
    const data: Record<string, string> = {
      merchant_id: params.merchantId,
      merchant_key: params.merchantKey,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      notify_url: params.notifyUrl,
      email_address: params.email,
      amount: params.amount.toFixed(2),
      item_name: params.itemName,
      m_payment_id: params.orderId,
    };

    const signature = this.generateSignature(data, params.passphrase);
    return { ...data, signature };
  }

  private generateSignature(data: Record<string, string>, passphrase?: string): string {
    const entries = Object.entries(data)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
      .join('&');

    const str = passphrase ? `${entries}&passphrase=${encodeURIComponent(passphrase)}` : entries;
    return crypto.createHash('md5').update(str).digest('hex');
  }

  private validateItnSignature(body: Record<string, string>): boolean {
    const { signature, ...data } = body;
    const passphrase = this.config.get<string>('PAYFAST_PASSPHRASE');
    const expected = this.generateSignature(data, passphrase);
    return expected === signature;
  }
}
