import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = performance.now();
    const { method, originalUrl } = request;
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    response.once('finish', () => {
      const duration = (performance.now() - startedAt).toFixed(2);
      this.logger.log(
        `${method} ${originalUrl} ${response.statusCode} +${duration}ms [${ip}]`,
      );
    });
    next();
  }
}
