import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProd = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestId = randomUUID();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (() => {
            const r = exception.getResponse();
            if (typeof r === 'string') return r;
            if (typeof r === 'object' && r !== null && 'message' in r) {
              return (r as any).message;
            }
            return 'An error occurred.';
          })()
        : 'Internal server error.';

    // Log 5xx errors with full detail; 4xx only get a short warning
    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${req.method} ${req.url} → ${status}`,
        this.isProd ? undefined : (exception instanceof Error ? exception.stack : String(exception)),
      );
    } else {
      this.logger.warn(`[${requestId}] ${req.method} ${req.url} → ${status}: ${message}`);
    }

    res.status(status).json({
      statusCode: status,
      message,
      requestId,
      ...(this.isProd ? {} : {
        // expose stack in dev for faster debugging
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    });
  }
}
