import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryUser } from '../delivery-users/delivery-user.entity';

const DELIVERY_EARNINGS_PER_ORDER = 2;

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(DeliveryUser)
    private readonly deliveryRepo: Repository<DeliveryUser>,
  ) {}

  async getStats(userId: string) {
    const user = await this.deliveryRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    const totalEarned = Number(user.totalEarned);
    const goal = Number(user.deliveryGoal ?? 0);
    const deliveryCount = Math.round(totalEarned / DELIVERY_EARNINGS_PER_ORDER);
    const progressPct = goal > 0 ? Math.min((totalEarned / goal) * 100, 100) : 0;
    const deliveriesToGoal = goal > 0
      ? Math.max(Math.ceil((goal - totalEarned) / DELIVERY_EARNINGS_PER_ORDER), 0)
      : null;

    return {
      totalEarned,
      deliveryCount,
      goal,
      progressPct,
      deliveriesToGoal,
      earningsPerOrder: DELIVERY_EARNINGS_PER_ORDER,
    };
  }

  async recordDelivery(userId: string): Promise<number> {
    const user = await this.deliveryRepo.findOne({ where: { id: userId } });
    if (!user) return 0;
    user.totalEarned = Number(user.totalEarned) + DELIVERY_EARNINGS_PER_ORDER;
    await this.deliveryRepo.save(user);
    return DELIVERY_EARNINGS_PER_ORDER;
  }
}
