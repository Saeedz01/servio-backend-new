import './load-env.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  // Validates every @Body({ schema }) / @Query({ schema }) against its
  // Zod schema. Invalid bodies get a 400 with readable messages.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // The Next.js frontend runs on http://localhost:3000 in development.
  app.enableCors({ origin: 'http://localhost:3000' });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
