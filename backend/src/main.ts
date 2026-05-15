import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

/**
 * Security hard-crash guard — refuse to start if critical secrets are missing.
 * An app running with empty/default JWT secrets would silently accept any forged token.
 * Better to crash loudly at boot than to serve in an insecure state.
 */
function assertRequiredSecrets() {
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(
      `[SECURITY] Missing required environment variables: ${missing.join(', ')}. ` +
      'Refusing to start — a server without JWT secrets would accept forged tokens.',
    );
    process.exit(1);
  }
}

async function bootstrap() {
  // Crash early rather than starting with missing secrets
  assertRequiredSecrets();

  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
  }));

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Order matters:
  //   1. AllExceptionsFilter — must be outermost so it catches everything
  //   2. SanitizePipe — strips HTML from all body strings before validation
  //   3. ValidationPipe — validates & transforms the now-clean input
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`DashCaf backend running on http://localhost:${port}`);
}

bootstrap();
