import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  UsePipes,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, ValidationPipe } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';

// ── Message DTOs (validated by the global gateway ValidationPipe) ─────────────

class JoinStoreDto {
  @IsUUID()
  storeId: string;
}

class JoinCustomerDto {
  @IsUUID()
  customerId: string;
}

class JoinOrderChatDto {
  @IsUUID()
  orderId: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    // Don't throw on empty payloads — some messages have no body
    validateCustomDecorators: true,
  }),
)
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
    credentials: true,
  },
})
export class OrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  afterInit() {
    this.logger.log('Socket.io gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_store')
  handleJoinStore(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinStoreDto,
  ) {
    const id = typeof payload === 'string' ? payload : payload?.storeId;
    if (id) client.join(`store:${id}`);
  }

  @SubscribeMessage('join_customer')
  handleJoinCustomer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinCustomerDto,
  ) {
    const id = typeof payload === 'string' ? payload : payload?.customerId;
    if (id) client.join(`customer:${id}`);
  }

  @SubscribeMessage('join_delivery')
  handleJoinDelivery(@ConnectedSocket() client: Socket) {
    client.join('delivery:global');
  }

  @SubscribeMessage('join_order_chat')
  handleJoinOrderChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinOrderChatDto,
  ) {
    const id = typeof payload === 'string' ? payload : payload?.orderId;
    if (id) client.join(`order:${id}`);
  }

  emitNewOrder(storeId: string, order: any) {
    this.server?.to(`store:${storeId}`).emit('new_order', order);
  }

  emitOrderChatMessage(orderId: string, message: any) {
    this.server?.to(`order:${orderId}`).emit('chat_message', message);
  }

  emitChatMessage(orderId: string, message: any) {
    this.server?.to(`order:${orderId}`).emit('chat_message', message);
  }

  emitHandoffCode(customerId: string, code: string, expiresAt: Date) {
    this.server?.to(`customer:${customerId}`).emit('handoff_code', { code, expiresAt });
  }

  emitHandoffConfirmed(customerId: string, deliveryId: string, orderId: string) {
    this.server?.to(`customer:${customerId}`).emit('handoff_confirmed', { orderId });
    this.server?.to('delivery:global').emit('handoff_confirmed', { orderId });
  }

  /** Rider broadcasts their GPS position; customer tracking page listens */
  emitRiderLocation(customerId: string, lat: number, lng: number) {
    this.server?.to(`customer:${customerId}`).emit('rider_location', { lat, lng });
  }
}
