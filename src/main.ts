import './load-env.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  // Service photos are sent as base64 data URLs in JSON; the default
  // ~100kb body limit rejects phone-camera images. 10mb covers a few
  // compressed JPEGs without opening the door to unbounded payloads.
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });
  // Validates every @Body({ schema }) / @Query({ schema }) against its
  // Zod schema. Invalid bodies get a 400 with readable messages.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // The Next.js frontend runs on http://localhost:3000 in development.
  app.enableCors({ origin: 'http://localhost:3000' });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
