import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response, NextFunction } from 'express';
import { BlockedIp } from '../entities/blocked-ip.entity';

const CACHE_TTL_MS = 30_000; // cache each IP result for 30 seconds

@Injectable()
export class IpBlockMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IpBlockMiddleware.name);
  private readonly cache = new Map<string, { blocked: boolean; expiresAt: number }>();

  constructor(
    @InjectRepository(BlockedIp)
    private readonly blockedIpRepo: Repository<BlockedIp>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip Socket.io transport requests — they're internal polling frames, not real API calls
    if (req.path.startsWith('/socket.io')) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || '';

    // Check the in-memory cache first
    const cached = this.cache.get(ip);
    if (cached && Date.now() < cached.expiresAt) {
      if (cached.blocked) throw new ForbiddenException('Access denied.');
      return next();
    }

    // Cache miss — hit the DB
    // SECURITY: fail-closed — if the DB is unreachable and we have no warm cache
    // we MUST NOT pass the request through, since a blocked IP would then slip past.
    try {
      const record = await this.blockedIpRepo.findOne({ where: { ipAddress: ip } });
      const isBlocked = !!(record && !record.unblockedAt);

      this.cache.set(ip, { blocked: isBlocked, expiresAt: Date.now() + CACHE_TTL_MS });

      if (isBlocked) throw new ForbiddenException('Access denied.');
      next();
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      // DB error with no warm cache — fail closed (503) rather than allowing unknown IPs
      this.logger.error(`IP block DB error for ${ip}: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Service temporarily unavailable.');
    }
  }
}
