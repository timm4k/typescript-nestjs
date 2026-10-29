import { Module } from '@nestjs/common';
import { ClothesModule } from '../clothes/clothes.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [ClothesModule, SharedModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
