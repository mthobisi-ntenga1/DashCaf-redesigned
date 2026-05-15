import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { DeliveryUser } from '../delivery-users/delivery-user.entity';
import { ControlUser } from '../control-users/control-user.entity';
import { RefreshToken } from '../common/entities/refresh-token.entity';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { UnauthorizedException } from '@nestjs/common';

const mockCustomerRepo = () => ({ findOne: jest.fn(), save: jest.fn() });
const mockRepo = () => ({ findOne: jest.fn(), save: jest.fn(), delete: jest.fn() });

describe('AuthService', () => {
  let service: AuthService;
  let customerRepo: ReturnType<typeof mockCustomerRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: jest.fn(() => 'token'), verify: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn((k, d) => d) } },
        { provide: getRepositoryToken(Customer), useFactory: mockCustomerRepo },
        { provide: getRepositoryToken(DeliveryUser), useFactory: mockRepo },
        { provide: getRepositoryToken(ControlUser), useFactory: mockRepo },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRepo },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    customerRepo = module.get(getRepositoryToken(Customer));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws UnauthorizedException when customer not found', async () => {
    customerRepo.findOne.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@test.com', password: 'pass' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
