import { Module } from '@nestjs/common';
import { ClothesModule } from './clothes/clothes.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { SharedModule } from './shared/shared.module.js';

@Module({ imports: [SharedModule, ClothesModule, OrdersModule] })
export class AppModule {}
