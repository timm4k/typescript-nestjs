import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ClothesService } from '../clothes/clothes.service.js';
import {
  FEE_CALCULATOR,
  type FeeCalculator,
} from '../shared/billing/fee-calculator.provider.js';
import { fromMinorUnits, toMinorUnits } from '../shared/billing/money.js';
import {
  STORE_CONFIG,
  type StoreConfig,
} from '../shared/config/app-config.provider.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { OrderEntity } from './order.entity.js';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly orders: OrderEntity[] = [];
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly clothesService: ClothesService,
    @Inject(STORE_CONFIG) private readonly config: StoreConfig,
    @Inject(FEE_CALCULATOR) private readonly feeCalculator: FeeCalculator,
  ) {}

  onModuleInit(): void {
    this.logger.log(
      'Orders service connected to catalog and billing | Ready to accept orders',
    );
  }

  createOrder(dto: CreateOrderDto): OrderEntity {
    const product = this.clothesService.findOne(dto.productId);
    const subtotal = fromMinorUnits(toMinorUnits(product.price) * dto.quantity);
    const taxAmount = this.feeCalculator.calculateTax(subtotal);
    const order: OrderEntity = {
      orderId: `order-${randomUUID()}`,
      productId: product.id,
      productTitle: product.title,
      productSlug: product.slug,
      unitPrice: product.price,
      quantity: dto.quantity,
      subtotal,
      taxPercent: this.config.taxPercent,
      taxAmount,
      total: fromMinorUnits(toMinorUnits(subtotal) + toMinorUnits(taxAmount)),
      currency: this.config.defaultCurrency,
      storeName: this.config.storeName,
      ...(dto.customerEmail === undefined
        ? {}
        : { customerEmail: dto.customerEmail }),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    this.orders.push(order);
    return { ...order };
  }

  findAll(): OrderEntity[] {
    return this.orders.map((order) => ({ ...order }));
  }
}
