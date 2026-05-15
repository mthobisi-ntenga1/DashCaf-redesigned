import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketStatus, SubmitterType } from './support-ticket.entity';

export class CreateTicketDto {
  submittedBy: string;
  submitterType: SubmitterType;
  subject: string;
  message: string;
}

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly repo: Repository<SupportTicket>,
  ) {}

  async create(dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.repo.create(dto);
    return this.repo.save(ticket);
  }

  async findAll(): Promise<SupportTicket[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found.');
    return ticket;
  }

  async assign(id: string, assignedTo: string, note: string): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.assignedTo = assignedTo;
    ticket.assignmentNote = note;
    ticket.status = TicketStatus.ASSIGNED;
    return this.repo.save(ticket);
  }

  async resolve(id: string): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.status = TicketStatus.RESOLVED;
    return this.repo.save(ticket);
  }
}
