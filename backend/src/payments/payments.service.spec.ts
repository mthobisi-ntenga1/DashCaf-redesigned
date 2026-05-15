import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Customer } from '../customers/customer.entity';
import { OrdersGateway } from '../orders/orders.gateway';
import { EmailService } from '../notifications/email.service';
import { BadRequestException } from '@nestjs/common';

const mockRepo = () => ({ findOne: jest.fn(), save: jest.fn() });

describe('PaymentsService', () => {
  let service: PaymentsService;
  let orderRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: { get: jest.fn((k) => k === 'PAYFAST_PASSPHRASE' ? 'testpass' : undefined) } },
        { provide: getRepositoryToken(Order), useFactory: mockRepo },
        { provide: getRepositoryToken(Customer), useFactory: mockRepo },
        { provide: OrdersGateway, useValue: { server: null } },
        { provide: EmailService, useValue: { orderConfirmed: jest.fn() } },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    orderRepo = module.get(getRepositoryToken(Order));
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('handlePayfastItn', () => {
    it('returns ignored for non-COMPLETE status', async () => {
      const result = await service.handlePayfastItn({ payment_status: 'FAILED', signature: 'x' } as any, {} as any);
      expect(result.status).toBe('ignored');
    });

    it('returns already_processed if order is not PENDING', async () => {
      jest.spyOn(service as any, 'validateItnSignature').mockReturnValue(true);
      orderRepo.findOne.mockResolvedValue({ id: '123', status: OrderStatus.CONFIRMED, customerId: 'c', storeSlug: 's' });
      const result = await service.handlePayfastItn({ payment_status: 'COMPLETE', m_payment_id: '123', signature: 'x' }, {} as any);
      expect(result.status).toBe('already_processed');
    });

    it('confirms a PENDING order on successful ITN', async () => {
      jest.spyOn(service as any, 'validateItnSignature').mockReturnValue(true);
      const mockOrder = { id: '123', status: OrderStatus.PENDING, customerId: 'c', storeSlug: 's', storeName: 'Cafe', total: 30 };
      orderRepo.findOne.mockResolvedValueOnce(mockOrder).mockResolvedValueOnce(null);
      orderRepo.save.mockResolvedValue({ ...mockOrder, status: OrderStatus.CONFIRMED });
      const result = await service.handlePayfastItn({ payment_status: 'COMPLETE', m_payment_id: '123', signature: 'x' }, {} as any);
      expect(result.status).toBe('ok');
      expect(orderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: OrderStatus.CONFIRMED }));
    });
  });
});
