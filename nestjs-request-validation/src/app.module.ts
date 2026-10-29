import {
  Module,
  RequestMethod,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { ClothesModule } from './clothes/clothes.module.js';
import { HttpLoggingMiddleware } from './common/middleware/http-logger.middleware.js';

@Module({ imports: [ClothesModule] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpLoggingMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
