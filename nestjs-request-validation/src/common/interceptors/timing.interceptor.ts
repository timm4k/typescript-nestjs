import {
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap, type Observable } from 'rxjs';

export class TimingInterceptor implements NestInterceptor<unknown, unknown> {
  private readonly logger = new Logger('TIMING');

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const startedAt = performance.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    let recorded = false;
    const recordTiming = (): void => {
      if (recorded) {
        return;
      }
      recorded = true;
      const duration = (performance.now() - startedAt).toFixed(2);
      if (!response.headersSent) {
        response.setHeader('X-Response-Time', `${duration}ms`);
      }
      this.logger.log(
        `${request.method} ${request.originalUrl} completed in ${duration}ms`,
      );
    };
    return next.handle().pipe(tap({ next: recordTiming, error: recordTiming }));
  }
}
