import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, OrderStatus, OrderType } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderMessage } from './order-message.entity';
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
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(d => d),
  save: jest.fn(d => Promise.resolve({ ...d, id: 'order-uuid' })),
  findBy: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useFactory: mockRepo },
        { provide: getRepositoryToken(OrderItem), useFactory: mockRepo },
        { provide: getRepositoryToken(OrderMessage), useFactory: mockRepo },
        { provide: getRepositoryToken(MenuItem), useFactory: mockRepo },
        { provide: getRepositoryToken(Store), useFactory: mockRepo },
        { provide: getRepositoryToken(Location), useFactory: mockRepo },
        { provide: getRepositoryToken(DeliveryUser), useFactory: mockRepo },
        { provide: getRepositoryToken(Customer), useFactory: mockRepo },
        { provide: OrdersGateway, useValue: { server: null, emitNewOrder: jest.fn(), emitChatMessage: jest.fn(), emitRiderLocation: jest.fn() } },
        { provide: EarningsService, useValue: { recordDelivery: jest.fn() } },
        { provide: EmailService, useValue: { orderConfirmed: jest.fn(), orderDelivered: jest.fn(), orderCancelled: jest.fn() } },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
        { provide: StoreStaffService, useValue: { verifyPin: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepo = module.get(getRepositoryToken(Order));
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('cancel', () => {
    it('throws if not the customer\'s order', async () => {
      orderRepo.findOne.mockResolvedValue({ id: '1', customerId: 'other', status: OrderStatus.PENDING, items: [], messages: [] });
      await expect(service.cancel('1', 'me')).rejects.toThrow(UnauthorizedException);
    });

    it('throws if order is past CONFIRMED', async () => {
      orderRepo.findOne.mockResolvedValue({ id: '1', customerId: 'me', status: OrderStatus.COOKING, items: [], messages: [] });
      await expect(service.cancel('1', 'me')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rateOrder', () => {
    it('throws if not delivered', async () => {
      orderRepo.findOne.mockResolvedValue({ id: '1', customerId: 'me', status: OrderStatus.COOKING, rating: null, items: [], messages: [] });
      await expect(service.rateOrder('1', 'me', 5)).rejects.toThrow(BadRequestException);
    });

    it('throws if rating out of range', async () => {
      orderRepo.findOne.mockResolvedValue({ id: '1', customerId: 'me', status: OrderStatus.DELIVERED, rating: null, items: [], messages: [] });
      await expect(service.rateOrder('1', 'me', 6)).rejects.toThrow(BadRequestException);
    });

    it('throws if already rated', async () => {
      orderRepo.findOne.mockResolvedValue({ id: '1', customerId: 'me', status: OrderStatus.DELIVERED, rating: 4, items: [], messages: [] });
      await expect(service.rateOrder('1', 'me', 3)).rejects.toThrow(BadRequestException);
    });
  });
});
