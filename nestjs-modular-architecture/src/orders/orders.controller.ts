import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto.js';
import type { OrderEntity } from './order.entity.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto): OrderEntity {
    return this.ordersService.createOrder(dto);
  }

  @Get()
  findAll(): OrderEntity[] {
    return this.ordersService.findAll();
  }
}
