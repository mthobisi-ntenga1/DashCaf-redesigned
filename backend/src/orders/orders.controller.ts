import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus } from './order.entity';
import { MessageSenderType } from './order-message.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.ordersService.create(user.sub, dto);
  }

  // Static routes MUST be defined before :id
  @Get('my')
  getMyOrders(@CurrentUser('sub') customerId: string) {
    return this.ordersService.findByCustomer(customerId);
  }

  @Get('available')
  getAvailable() {
    return this.ordersService.findAvailable();
  }

  @Get('my-active')
  getMyActive(@CurrentUser('sub') deliveryUserId: string) {
    return this.ordersService.findMyActive(deliveryUserId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('workerPin') workerPin?: string,
  ) {
    return this.ordersService.updateStatus(id, status as OrderStatus, workerPin);
  }

  @Post(':id/claim')
  claim(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.ordersService.claim(id, userId);
  }

  @Post(':id/handoff')
  handoff(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body('code') code: string,
  ) {
    return this.ordersService.handoff(id, userId, code);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('sub') customerId: string) {
    return this.ordersService.cancel(id, customerId);
  }

  @Post(':id/rate')
  rate(
    @Param('id') id: string,
    @CurrentUser('sub') customerId: string,
    @Body('rating') rating: number,
    @Body('review') review?: string,
  ) {
    return this.ordersService.rateOrder(id, customerId, rating, review);
  }

  @Post(':id/location')
  updateLocation(
    @Param('id') id: string,
    @CurrentUser('sub') deliveryUserId: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.ordersService.updateRiderLocation(id, deliveryUserId, lat, lng);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    const senderType =
      user.userType === 'DELIVERY'
        ? MessageSenderType.DELIVERY
        : user.userType === 'STORE'
          ? MessageSenderType.STORE
          : MessageSenderType.CUSTOMER;
    return this.ordersService.addMessage(id, senderType, user.name ?? user.email, content);
  }
}

// Separate controller for /stores/:slug/orders
@Controller('stores')
export class StoreOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':slug/orders')
  getStoreOrders(@Param('slug') slug: string, @Query('status') statusFilter: string) {
    return this.ordersService.findByStore(slug, statusFilter);
  }
}
