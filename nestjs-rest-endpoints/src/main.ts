import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const portInput = process.env['PORT'] ?? '3000';
  const port = Number(portInput);
  if (
    !/^[0-9]+$/.test(portInput) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  const host = process.env['HOST'] ?? '127.0.0.1';
  if (host.trim().length === 0) {
    throw new Error('HOST must not be empty');
  }
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(port, host);
  Logger.log(`Clothes API listening at ${await app.getUrl()}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Application startup failed',
  );
  process.exitCode = 1;
});
