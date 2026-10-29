import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import {
  FEE_CALCULATOR,
  FeeCalculatorProvider,
} from './billing/fee-calculator.provider.js';
import {
  STORE_CONFIG,
  StoreConfigProvider,
} from './config/app-config.provider.js';
import { RequestIdService } from './request-scope/request-id.service.js';
import { RequestScopeController } from './request-scope/request-scope.controller.js';
import { RequestScopeService } from './request-scope/request-scope.service.js';
import { SlugService } from './slug.service.js';

@Global()
@Module({
  controllers: [RequestScopeController],
  providers: [
    SlugService,
    StoreConfigProvider,
    FeeCalculatorProvider,
    RequestIdService,
    RequestScopeService,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          validationError: { target: false, value: false },
        }),
    },
  ],
  exports: [SlugService, STORE_CONFIG, FEE_CALCULATOR, RequestIdService],
})
export class SharedModule {}
