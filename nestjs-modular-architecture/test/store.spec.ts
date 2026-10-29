import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, test } from 'node:test';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, type INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { ClothesService } from '../src/clothes/clothes.service.js';
import type { ClothingEntity } from '../src/clothes/clothing.entity.js';
import type { OrderEntity } from '../src/orders/order.entity.js';
import { OrdersService } from '../src/orders/orders.service.js';
import {
  FeeCalculatorProvider,
  FEE_CALCULATOR,
  type FeeCalculator,
} from '../src/shared/billing/fee-calculator.provider.js';
import { fromMinorUnits, toMinorUnits } from '../src/shared/billing/money.js';
import {
  STORE_CONFIG,
  type StoreConfig,
} from '../src/shared/config/app-config.provider.js';
import type { RequestScopeResult } from '../src/shared/request-scope/request-scope.controller.js';
import { SlugService } from '../src/shared/slug.service.js';

const validClothing = {
  title: 'Cotton T-Shirt',
  price: 850,
  size: 'M',
  material: 'Cotton',
  color: 'Lavender',
};

test('slug generation normalizes case, punctuation, accents and Unicode text', () => {
  const service = new SlugService();
  assert.equal(service.generateSlug('  Pro Laptop 16  '), 'pro-laptop-16');
  assert.equal(
    service.generateSlug('Cotton & Linen / T-Shirt'),
    'cotton-linen-t-shirt',
  );
  assert.equal(service.generateSlug('Café Dress'), 'cafe-dress');
  assert.equal(service.generateSlug('Лляна Сукня'), 'лляна-сукня');
  assert.throws(() => service.generateSlug(' --- '), BadRequestException);
});

test('money helpers reject invalid amounts and unsafe ranges', () => {
  assert.equal(toMinorUnits(19.99), 1999);
  assert.equal(fromMinorUnits(1999), 19.99);
  for (const value of [-1, NaN, Infinity, Number.MAX_VALUE]) {
    assert.throws(() => toMinorUnits(value), BadRequestException);
  }
  assert.throws(() => fromMinorUnits(1.5), BadRequestException);
});

test('fee factory uses its injected configuration and rounds tax to minor units', () => {
  const config: StoreConfig = {
    storeName: 'Test',
    defaultCurrency: 'UAH',
    taxPercent: 7.5,
  };
  const calculator = FeeCalculatorProvider.useFactory(config);
  assert.equal(calculator.calculateTax(100), 7.5);
  assert.equal(calculator.calculateTax(0.2), 0.02);
  assert.equal(calculator.calculateTax(0), 0);
  assert.throws(() => calculator.calculateTax(-1), BadRequestException);
  assert.throws(() =>
    FeeCalculatorProvider.useFactory({ ...config, taxPercent: 101 }),
  );
});

test('catalog lifecycle seeds exactly two entities and does not duplicate on repeated initialization', () => {
  const service = new ClothesService(new SlugService());
  assert.equal(service.findAll().length, 0);
  service.onModuleInit();
  service.onModuleInit();
  assert.equal(service.findAll().length, 2);
  assert.equal(
    service.findOne('clothing-1').slug,
    'sweat-oversized-pullover-hoodie',
  );
});

describe('Modular store HTTP API', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeEach(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterEach(async () => {
    await app.close();
  });

  async function send(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
    });
  }

  it('initializes catalog and starts with no orders', async () => {
    const response = await send('GET', '/clothes');
    assert.equal(response.status, 200);
    const items = (await response.json()) as ClothingEntity[];
    assert.equal(items.length, 2);
    assert.ok(items.every((item) => item.slug.length > 0));
    assert.deepEqual(await (await send('GET', '/orders')).json(), []);
  });

  it('resolves globally exported config and factory providers through DI', () => {
    const config = app.get<StoreConfig>(STORE_CONFIG);
    assert.deepEqual(config, {
      storeName: 'Thread & Form',
      defaultCurrency: 'UAH',
      taxPercent: 20,
    });
    assert.equal(Object.isFrozen(config), true);
    assert.equal(
      app.get<FeeCalculator>(FEE_CALCULATOR).calculateTax(3600),
      720,
    );
  });

  it('creates clothing and generates a slug through the shared service', async () => {
    const response = await send('POST', '/clothes', {
      ...validClothing,
      title: '  Cotton & Linen Shirt  ',
    });
    assert.equal(response.status, 201);
    const item = (await response.json()) as ClothingEntity;
    assert.equal(item.slug, 'cotton-linen-shirt');
    assert.equal(item.title, 'Cotton & Linen Shirt');
    assert.match(item.id, /^clothing-[0-9a-f-]{36}$/);
    assert.equal((await send('GET', `/clothes/${item.id}`)).status, 200);
  });

  it('updates the slug with the title and preserves it on a price-only update', async () => {
    const response = await send('PATCH', '/clothes/clothing-1', {
      title: 'Linen Shirt',
    });
    const updated = (await response.json()) as ClothingEntity;
    assert.equal(updated.slug, 'linen-shirt');
    const priceOnly = await send('PATCH', '/clothes/clothing-1', {
      price: 999,
    });
    const finalItem = (await priceOnly.json()) as ClothingEntity;
    assert.equal(finalItem.slug, 'linen-shirt');
    assert.equal(finalItem.id, 'clothing-1');
  });

  it('rejects invalid and client-controlled clothing fields without storing records', async () => {
    for (const patch of [
      { price: -1 },
      { price: '850' },
      { size: 'XXL' },
      { title: '---' },
      { title: null },
      { slug: 'injected' },
      { id: 'injected' },
    ]) {
      assert.equal(
        (await send('POST', '/clothes', { ...validClothing, ...patch })).status,
        400,
      );
    }
    assert.equal(app.get(ClothesService).findAll().length, 2);
  });

  it('rejects invalid partial updates and leaves the original catalog unchanged', async () => {
    const before = app.get(ClothesService).findOne('clothing-1');
    for (const patch of [
      { price: null },
      { title: '---' },
      { slug: 'injected' },
      { id: 'replacement' },
    ]) {
      assert.equal(
        (await send('PATCH', '/clothes/clothing-1', patch)).status,
        400,
      );
    }
    assert.deepEqual(app.get(ClothesService).findOne('clothing-1'), before);
  });

  it('creates an order with the current catalog price and tax from the factory', async () => {
    const response = await send('POST', '/orders', {
      productId: 'clothing-1',
      quantity: 2,
      customerEmail: ' customer@example.com ',
    });
    assert.equal(response.status, 201);
    const order = (await response.json()) as OrderEntity;
    assert.equal(order.productSlug, 'sweat-oversized-pullover-hoodie');
    assert.equal(order.unitPrice, 1800);
    assert.equal(order.quantity, 2);
    assert.equal(order.subtotal, 3600);
    assert.equal(order.taxPercent, 20);
    assert.equal(order.taxAmount, 720);
    assert.equal(order.total, 4320);
    assert.equal(order.currency, 'UAH');
    assert.equal(order.storeName, 'Thread & Form');
    assert.equal(order.status, 'confirmed');
    assert.equal(order.customerEmail, 'customer@example.com');
    assert.ok(Number.isFinite(Date.parse(order.createdAt)));
    assert.deepEqual(await (await send('GET', '/orders')).json(), [order]);
  });

  it('supports orders without the optional customer email', async () => {
    const response = await send('POST', '/orders', {
      productId: 'clothing-2',
      quantity: 1,
    });
    assert.equal(response.status, 201);
    const order = (await response.json()) as OrderEntity;
    assert.equal(order.total, 1140);
    assert.equal(Object.hasOwn(order, 'customerEmail'), false);
  });

  it('reads updated catalog values for new orders and preserves previous snapshots', async () => {
    const first = (await (
      await send('POST', '/orders', { productId: 'clothing-1', quantity: 1 })
    ).json()) as OrderEntity;
    await send('PATCH', '/clothes/clothing-1', {
      price: 1000,
      title: 'Updated Hoodie',
    });
    const second = (await (
      await send('POST', '/orders', { productId: 'clothing-1', quantity: 2 })
    ).json()) as OrderEntity;
    assert.equal(first.unitPrice, 1800);
    assert.equal(second.unitPrice, 1000);
    assert.equal(second.productSlug, 'updated-hoodie');
    assert.equal(second.total, 2400);
    assert.notEqual(first.orderId, second.orderId);
    const stored = (await (
      await send('GET', '/orders')
    ).json()) as OrderEntity[];
    assert.deepEqual(stored[0], first);
  });

  it('calculates decimal amounts without floating point noise', async () => {
    await send('PATCH', '/clothes/clothing-1', { price: 0.1 });
    const order = (await (
      await send('POST', '/orders', { productId: 'clothing-1', quantity: 3 })
    ).json()) as OrderEntity;
    assert.equal(order.subtotal, 0.3);
    assert.equal(order.taxAmount, 0.06);
    assert.equal(order.total, 0.36);
  });

  it('returns 404 for a missing product and never stores the failed order', async () => {
    const response = await send('POST', '/orders', {
      productId: 'missing',
      quantity: 2,
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      message: 'Clothing with ID missing was not found',
      error: 'Not Found',
      statusCode: 404,
    });
    assert.equal(app.get(OrdersService).findAll().length, 0);
  });

  for (const quantity of [0, -1, 1.5, '2', null, 10001]) {
    it(`rejects invalid order quantity ${JSON.stringify(quantity)}`, async () => {
      assert.equal(
        (await send('POST', '/orders', { productId: 'clothing-1', quantity }))
          .status,
        400,
      );
      assert.equal(app.get(OrdersService).findAll().length, 0);
    });
  }

  it('rejects missing or malformed order fields and client-calculated totals', async () => {
    for (const body of [
      {},
      { productId: ' ', quantity: 1 },
      { productId: 1, quantity: 1 },
      { productId: 'clothing-1', quantity: 1, customerEmail: 'invalid' },
      { productId: 'clothing-1', quantity: 1, customerEmail: null },
      { productId: 'clothing-1', quantity: 1, total: 1 },
    ]) {
      assert.equal((await send('POST', '/orders', body)).status, 400);
    }
  });

  it('removes clothing while preserving existing order snapshots', async () => {
    const order = (await (
      await send('POST', '/orders', { productId: 'clothing-1', quantity: 1 })
    ).json()) as OrderEntity;
    const deleted = await send('DELETE', '/clothes/clothing-1');
    assert.equal(deleted.status, 204);
    assert.equal(await deleted.text(), '');
    assert.equal((await send('GET', '/clothes/clothing-1')).status, 404);
    assert.equal(
      (await send('POST', '/orders', { productId: 'clothing-1', quantity: 1 }))
        .status,
      404,
    );
    assert.deepEqual(await (await send('GET', '/orders')).json(), [order]);
  });

  it('reuses a request-scoped instance within one request and replaces it across requests', async () => {
    const firstResponse = await send('GET', '/diagnostics/request-scope');
    assert.equal(firstResponse.status, 200);
    const first = (await firstResponse.json()) as RequestScopeResult;
    const second = (await (
      await send('GET', '/diagnostics/request-scope')
    ).json()) as RequestScopeResult;
    assert.equal(first.scope, 'REQUEST');
    assert.equal(first.sameInstance, true);
    assert.equal(first.controllerInstanceId, first.serviceInstanceId);
    assert.equal(second.controllerInstanceId, second.serviceInstanceId);
    assert.notEqual(first.controllerInstanceId, second.controllerInstanceId);
  });

  it('request scope diagnostics do not reset singleton catalog or order storage', async () => {
    await send('POST', '/orders', { productId: 'clothing-1', quantity: 1 });
    await send('POST', '/clothes', validClothing);
    await send('GET', '/diagnostics/request-scope');
    await send('GET', '/diagnostics/request-scope');
    const orders = (await (
      await send('GET', '/orders')
    ).json()) as OrderEntity[];
    const clothes = (await (
      await send('GET', '/clothes')
    ).json()) as ClothingEntity[];
    assert.equal(orders.length, 1);
    assert.equal(clothes.length, 3);
  });

  it('does not expose mutable service storage through returned objects', () => {
    const clothes = app.get(ClothesService);
    const orders = app.get(OrdersService);
    const order = orders.createOrder({ productId: 'clothing-1', quantity: 1 });
    order.total = 0;
    const list = orders.findAll();
    const first = list[0];
    assert.ok(first);
    first.total = 1;
    list.pop();
    clothes.findOne('clothing-1').price = 0;
    assert.equal(orders.findAll()[0]?.total, 2160);
    assert.equal(clothes.findOne('clothing-1').price, 1800);
  });
});
