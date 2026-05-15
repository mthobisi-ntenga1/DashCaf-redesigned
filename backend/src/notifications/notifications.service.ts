import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {
    const publicKey = config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = config.get<string>('VAPID_PRIVATE_KEY');
    const subject = config.get<string>('VAPID_SUBJECT', 'mailto:support@dashcaf.com');

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    }
  }

  async sendPush(subscription: webpush.PushSubscription, payload: object) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (err) {
      this.logger.error('Push notification failed', err?.message);
    }
  }

  async notifyOrderStatus(subscription: webpush.PushSubscription, status: string, orderId: string) {
    return this.sendPush(subscription, {
      title: 'DashCaf Order Update',
      body: `Your order is now: ${status}`,
      orderId,
    });
  }

  async notifyNewOrder(subscription: webpush.PushSubscription, orderId: string) {
    return this.sendPush(subscription, {
      title: 'New Order!',
      body: 'A new order has been placed.',
      orderId,
    });
  }
}
