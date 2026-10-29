import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js';
import { TrimPipe } from './common/pipes/trim.pipe.js';

export function configureApplication(app: INestApplication): void {
  app.useGlobalPipes(
    new TrimPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TimingInterceptor());
}
