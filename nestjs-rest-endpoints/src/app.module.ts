import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { ClothesController } from './clothes/clothes.controller.js';
import { ClothesService } from './clothes/clothes.service.js';

@Module({
  controllers: [AppController, ClothesController],
  providers: [
    ClothesService,
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
})
export class AppModule {}
