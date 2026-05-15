import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Order, OrderStatus, OrderType } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderMessage, MessageSenderType } from './order-message.entity';
import { MenuItem } from '../menu/menu-item.entity';
import { Store } from '../stores/store.entity';
import { Location } from '../locations/location.entity';
import { DeliveryUser } from '../delivery-users/delivery-user.entity';
import { Customer } from '../customers/customer.entity';
import { OrdersGateway } from './orders.gateway';
import { EarningsService } from '../earnings/earnings.service';
import { EmailService } from '../notifications/email.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { StoreStaffService } from '../store-staff/store-staff.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderMessage)
    private readonly msgRepo: Repository<OrderMessage>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(DeliveryUser)
    private readonly deliveryRepo: Repository<DeliveryUser>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly gateway: OrdersGateway,
    private readonly earningsService: EarningsService,
    private readonly emailService: EmailService,
    private readonly auditLog: AuditLogService,
    private readonly staffService: StoreStaffService,
  ) {}

  async create(customerId: string, dto: {
    storeSlug: string;
    orderType?: OrderType;
    items: { menuItemId: string; quantity: number }[];
    deliveryLocationId?: string;
    deliveryNote?: string;
  }): Promise<Order> {
    const store = await this.storeRepo.findOne({ where: { slug: dto.storeSlug } });
    if (!store) throw new NotFoundException('Store not found.');

    const orderType: OrderType = dto.orderType === OrderType.COLLECT
      ? OrderType.COLLECT
      : OrderType.DELIVERY;

    // Delivery orders must have a drop-off location
    if (orderType === OrderType.DELIVERY && !dto.deliveryLocationId) {
      throw new BadRequestException('A delivery location is required for delivery orders.');
    }

    // Resolve menu items
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.menuItemRepo.findBy({ id: In(menuItemIds) });

    const orderItems: Partial<OrderItem>[] = [];
    let subtotal = 0;
    for (const line of dto.items) {
      const mi = menuItems.find((m) => m.id === line.menuItemId);
      if (!mi) throw new BadRequestException(`Menu item ${line.menuItemId} not found.`);
      if (!mi.isAvailable) throw new BadRequestException(`${mi.name} is not currently available.`);
      const lineTotal = Number(mi.displayPrice) * line.quantity;
      subtotal += lineTotal;
      orderItems.push({
        menuItemId: mi.id,
        name: mi.name,
        quantity: line.quantity,
        price: Number(mi.displayPrice),
      });
    }

    // ── Fee structure ────────────────────────────────────────────────────────
    // Platform fee: R2 on every order (collect or delivery) — goes to us
    // Delivery fee: R5 on delivery orders only — R3 to us, R2 to the rider
    // ─────────────────────────────────────────────────────────────────────────
    const PLATFORM_FEE = 2;
    const DELIVERY_FEE = orderType === OrderType.DELIVERY ? 5 : 0;
    const total = subtotal + PLATFORM_FEE + DELIVERY_FEE;

    // Resolve location (delivery only)
    let locationName: string | null = null;
    if (dto.deliveryLocationId) {
      const loc = await this.locationRepo.findOne({ where: { id: dto.deliveryLocationId } });
      if (loc) locationName = `${loc.name}, ${loc.building}`;
    }

    // Generate 4-digit handoff code
    const handoffCode = String(Math.floor(1000 + Math.random() * 9000));

    const order = this.orderRepo.create({
      customerId,
      storeSlug: dto.storeSlug,
      storeName: store.name,
      orderType,
      total,
      platformFee: PLATFORM_FEE,
      deliveryFee: DELIVERY_FEE,
      deliveryLocationId: dto.deliveryLocationId ?? null,
      deliveryLocationName: locationName,
      deliveryNote: dto.deliveryNote ?? null,
      handoffCode,
    });

    const saved = await this.orderRepo.save(order);

    // Save order items
    const itemEntities = orderItems.map((i) =>
      this.itemRepo.create({ ...i, orderId: saved.id }),
    );
    await this.itemRepo.save(itemEntities);

    // Reload with items
    const full = await this.findOne(saved.id);

    // Notify store
    this.gateway.emitNewOrder(store.id, full);

    return full;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'messages'],
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStore(storeSlug: string, statusFilter?: string): Promise<Order[]> {
    const where: any = { storeSlug };
    if (statusFilter) {
      const statuses = statusFilter.split(',').map((s) => s.trim()) as OrderStatus[];
      return this.orderRepo.find({
        where: statuses.map((s) => ({ storeSlug, status: s })),
        order: { createdAt: 'DESC' },
      });
    }
    return this.orderRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findAvailable(): Promise<Order[]> {
    // Only DELIVERY orders go into the rider queue — collect orders are picked up by the customer directly
    return this.orderRepo.find({
      where: { status: OrderStatus.READY, claimedByUserId: IsNull(), orderType: OrderType.DELIVERY },
      order: { createdAt: 'ASC' },
    });
  }

  async findMyActive(deliveryUserId: string): Promise<Order | null> {
    const order = await this.orderRepo.findOne({
      where: { claimedByUserId: deliveryUserId, status: OrderStatus.CLAIMED },
      relations: ['items', 'messages'],
    });
    return order ?? null;
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    workerPin?: string,
  ): Promise<Order & { workerName?: string }> {
    const order = await this.findOne(orderId);

    // Verify worker PIN if provided — throws UnauthorizedException on wrong PIN
    let worker: { id: string; name: string; role: string } | null = null;
    if (workerPin) {
      worker = await this.staffService.verifyPin(order.storeSlug, workerPin);
    }

    order.status = newStatus;
    const saved = await this.orderRepo.save(order);

    // Log who handled this order action
    if (worker) {
      this.auditLog.log({
        actor: { id: worker.id, email: worker.name, role: worker.role },
        action: `ORDER_${newStatus}`,
        targetType: 'Order',
        targetId: orderId,
        metadata: { storeSlug: order.storeSlug, workerName: worker.name },
      });
    }

    // Emit socket events
    this.gateway.server?.to(`customer:${order.customerId}`).emit('order_status_update', {
      orderId: order.id,
      status: newStatus,
    });
    this.gateway.server?.to(`store:${order.storeSlug}`).emit('order_status_update', {
      orderId: order.id,
      status: newStatus,
    });

    if (newStatus === OrderStatus.READY) {
      this.gateway.server?.to('delivery:global').emit('order_ready', { orderId: order.id });
    }

    if (newStatus === OrderStatus.DELIVERED) {
      const customer = await this.customerRepo.findOne({ where: { id: order.customerId } });
      if (customer) {
        this.emailService.orderDelivered(customer.email, order.id, order.storeName);
      }
    }

    return { ...saved, workerName: worker?.name };
  }

  async claim(orderId: string, deliveryUserId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Order is not available for claiming.');
    }
    if (order.claimedByUserId) {
      throw new BadRequestException('Order already claimed.');
    }
    order.status = OrderStatus.CLAIMED;
    order.claimedByUserId = deliveryUserId;
    const saved = await this.orderRepo.save(order);

    this.gateway.server?.to('delivery:global').emit('order_claimed', { orderId });
    this.gateway.server?.to(`customer:${order.customerId}`).emit('order_status_update', {
      orderId,
      status: OrderStatus.CLAIMED,
    });

    return saved;
  }

  async handoff(orderId: string, deliveryUserId: string, code: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (order.claimedByUserId !== deliveryUserId) {
      throw new UnauthorizedException('Not your delivery.');
    }
    if (order.handoffCode !== code) {
      throw new BadRequestException('Incorrect handoff code.');
    }
    order.status = OrderStatus.DELIVERED;
    const saved = await this.orderRepo.save(order);

    // Record earnings
    await this.earningsService.recordDelivery(deliveryUserId);

    // Notify
    this.gateway.server?.to(`customer:${order.customerId}`).emit('handoff_confirmed', { orderId });
    this.gateway.server?.to('delivery:global').emit('handoff_confirmed', { orderId });

    return saved;
  }

  async cancel(orderId: string, customerId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (order.customerId !== customerId) {
      throw new UnauthorizedException('Not your order.');
    }
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Order can only be cancelled while pending or confirmed.');
    }
    order.status = OrderStatus.CANCELLED;
    const saved = await this.orderRepo.save(order);

    // Notify store and customer via socket
    this.gateway.server?.to(`store:${order.storeSlug}`).emit('order_status_update', {
      orderId: order.id,
      status: OrderStatus.CANCELLED,
    });
    this.gateway.server?.to(`customer:${order.customerId}`).emit('order_status_update', {
      orderId: order.id,
      status: OrderStatus.CANCELLED,
    });

    // Email confirmation to customer
    const customer = await this.customerRepo.findOne({ where: { id: customerId }, select: ['id', 'email'] });
    if (customer) this.emailService.orderCancelled(customer.email, order.id, order.storeName);

    return saved;
  }

  async updateRiderLocation(orderId: string, deliveryUserId: string, lat: number, lng: number) {
    const order = await this.findOne(orderId);
    if (order.claimedByUserId !== deliveryUserId) {
      throw new UnauthorizedException('Not your delivery.');
    }
    if (order.status !== OrderStatus.CLAIMED) {
      throw new BadRequestException('Order is not in transit.');
    }
    // Push location to the customer tracking page in real time
    this.gateway.emitRiderLocation(order.customerId, lat, lng);
    return { ok: true };
  }

  async rateOrder(
    orderId: string,
    customerId: string,
    rating: number,
    review?: string,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    if (order.customerId !== customerId) {
      throw new UnauthorizedException('Not your order.');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('You can only rate a delivered order.');
    }
    if (order.rating !== null && order.rating !== undefined) {
      throw new BadRequestException('Order has already been rated.');
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new BadRequestException('Rating must be a whole number between 1 and 5.');
    }
    order.rating = rating;
    order.review = review ?? null;
    return this.orderRepo.save(order);
  }

  async addMessage(
    orderId: string,
    senderType: MessageSenderType,
    senderName: string,
    content: string,
  ): Promise<OrderMessage> {
    const order = await this.findOne(orderId);
    const msg = this.msgRepo.create({ orderId, senderType, senderName, content });
    const saved = await this.msgRepo.save(msg);

    this.gateway.emitChatMessage(orderId, saved);

    return saved;
  }
}
