import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: config.get('SMTP_HOST', 'smtp.gmail.com'),
        port: config.get<number>('SMTP_PORT', 587),
        secure: false,
        auth: { user, pass },
      });
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`Email skipped (SMTP not configured): ${subject} → ${to}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM', '"DashCaf" <noreply@dashcaf.com>'),
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Email failed to ${to}: ${err?.message}`);
    }
  }

  storeApproved(email: string, storeName: string) {
    return this.send(
      email,
      '🎉 Your DashCaf store has been approved!',
      `<h2>Congratulations!</h2>
       <p>Your store <strong>${storeName}</strong> has been approved and is now live on DashCaf.</p>
       <p>Log in to set up your menu and start receiving orders.</p>`,
    );
  }

  storeRejected(email: string, storeName: string, reason: string) {
    return this.send(
      email,
      'DashCaf — Store Application Update',
      `<h2>Application Update</h2>
       <p>Unfortunately, your store <strong>${storeName}</strong> application was not approved.</p>
       <p><strong>Reason:</strong> ${reason}</p>
       <p>If you have questions, please contact support.</p>`,
    );
  }

  deliveryApproved(email: string, name: string) {
    return this.send(
      email,
      '✅ DashCaf Delivery Application Approved!',
      `<h2>Welcome aboard, ${name}!</h2>
       <p>Your delivery worker application has been approved. You can now log in and start accepting orders.</p>`,
    );
  }

  deliveryRejected(email: string, name: string, reason: string) {
    return this.send(
      email,
      'DashCaf — Delivery Application Update',
      `<h2>Application Update</h2>
       <p>Hi ${name}, your delivery worker application was not approved at this time.</p>
       <p><strong>Reason:</strong> ${reason}</p>
       <p>If you have questions, please contact support.</p>`,
    );
  }

  orderCancelled(email: string, orderId: string, storeName: string) {
    return this.send(
      email,
      'DashCaf — Order Cancelled',
      `<h2>Order Cancelled</h2>
       <p>Your order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> from <strong>${storeName}</strong> has been cancelled.</p>
       <p>If you have questions, please contact support.</p>`,
    );
  }

  /** Sent after PayFast ITN confirms payment and order moves to CONFIRMED */
  orderConfirmed(email: string, orderId: string, storeName: string, total: number) {
    return this.send(
      email,
      '✅ DashCaf — Order Confirmed!',
      `<h2>Your order is confirmed!</h2>
       <p>Order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> from <strong>${storeName}</strong> has been received and paid.</p>
       <p><strong>Total paid: R${total.toFixed(2)}</strong></p>
       <p>You can track your order in the DashCaf app.</p>`,
    );
  }

  /** Sent when the order status reaches DELIVERED */
  orderDelivered(email: string, orderId: string, storeName: string) {
    return this.send(
      email,
      '🎉 DashCaf — Order Delivered!',
      `<h2>Enjoy your food!</h2>
       <p>Your order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> from <strong>${storeName}</strong> has been delivered.</p>
       <p>Thanks for using DashCaf!</p>`,
    );
  }
}
