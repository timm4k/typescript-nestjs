import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import type { Clothing } from '../src/clothes/clothing.entity.js';
import { ClothesService } from '../src/clothes/clothes.service.js';

const validClothing = {
  title: 'Cotton T-Shirt',
  price: 850,
  size: 'M',
  material: 'Cotton',
  color: 'Lavender',
};

describe('Clothes REST API', () => {
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

  it('returns application information at the root', async () => {
    const response = await send('GET', '/');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      application: 'Clothes REST API',
      resource: '/clothes',
      storage: 'in-memory',
    });
  });

  it('lists three seeded records and both custom response headers', async () => {
    const response = await send('GET', '/clothes');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-api-version'), '1.0');
    assert.equal(response.headers.get('x-service-status'), 'operational');
    const items = (await response.json()) as Clothing[];
    assert.equal(items.length, 3);
    assert.deepEqual(
      items.map((item) => item.id),
      ['1', '2', '3'],
    );
  });

  it('searches title case-insensitively and applies limit after filtering', async () => {
    const response = await send('GET', '/clothes?search=SWEAT&limit=1');
    assert.equal(response.status, 200);
    const items = (await response.json()) as Clothing[];
    assert.equal(items.length, 1);
    assert.equal(items[0]?.id, '1');
    const noMatches = await send('GET', '/clothes?search=nonexistent');
    assert.deepEqual(await noMatches.json(), []);
  });

  it('supports limit-only queries and empty search', async () => {
    const response = await send('GET', '/clothes?limit=2&search=');
    assert.equal(response.status, 200);
    const items = (await response.json()) as Clothing[];
    assert.equal(items.length, 2);
  });

  for (const limit of [
    '',
    '0',
    '-1',
    '1.5',
    'abc',
    '1e2',
    '1001',
    '9007199254740992',
  ]) {
    it(`rejects invalid limit ${JSON.stringify(limit)} with 400`, async () => {
      const response = await send(
        'GET',
        `/clothes?limit=${encodeURIComponent(limit)}`,
      );
      assert.equal(response.status, 400);
    });
  }

  it('rejects oversized search with 400', async () => {
    assert.equal(
      (await send('GET', `/clothes?search=${'a'.repeat(121)}`)).status,
      400,
    );
  });

  it('retrieves a record by its seeded ID', async () => {
    const response = await send('GET', '/clothes/1');
    assert.equal(response.status, 200);
    const item = (await response.json()) as Clothing;
    assert.equal(item.title, 'Sweat Oversized Pullover Hoodie');
  });

  it('returns the standard NestJS 404 body for a missing record', async () => {
    const response = await send('GET', '/clothes/99999');
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      message: 'Clothing with ID 99999 was not found',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('creates a validated record with status 201, UUID and trimmed text', async () => {
    const response = await send('POST', '/clothes', {
      ...validClothing,
      title: '  Cotton T-Shirt  ',
      color: ' Lavender ',
    });
    assert.equal(response.status, 201);
    const item = (await response.json()) as Clothing;
    assert.match(item.id, /^[0-9a-f-]{36}$/);
    assert.deepEqual(item, { ...validClothing, id: item.id });
    assert.equal((await send('GET', `/clothes/${item.id}`)).status, 200);
  });

  for (const patch of [
    { price: -1 },
    { price: '850' },
    { price: 1.234 },
    { price: null },
    { size: 'XXL' },
    { title: '   ' },
    { material: '' },
    { color: null },
    { id: 'injected-id' },
  ]) {
    it(`rejects invalid creation fields ${JSON.stringify(patch)}`, async () => {
      assert.equal(
        (await send('POST', '/clothes', { ...validClothing, ...patch })).status,
        400,
      );
      assert.equal(app.get(ClothesService).findAll().length, 3);
    });
  }

  it('rejects incomplete or array payloads', async () => {
    assert.equal(
      (await send('POST', '/clothes', { title: 'Missing fields' })).status,
      400,
    );
    assert.equal((await send('POST', '/clothes', [])).status, 400);
  });

  it('partially updates a record and preserves unspecified fields and ID', async () => {
    const before = app.get(ClothesService).findOne('1');
    const response = await send('PATCH', '/clothes/1', {
      price: 1650,
      color: 'Black',
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ...before,
      price: 1650,
      color: 'Black',
    });
    assert.deepEqual(before, { ...before, price: 1800, color: 'Gray' });
  });

  it('rejects null and system fields in PATCH without changing stored data', async () => {
    const before = app.get(ClothesService).findOne('1');
    for (const patch of [
      { price: null },
      { title: null },
      { id: 'replacement' },
      { price: -1 },
    ]) {
      assert.equal((await send('PATCH', '/clothes/1', patch)).status, 400);
    }
    assert.deepEqual(app.get(ClothesService).findOne('1'), before);
  });

  it('treats an empty PATCH as an unchanged existing record', async () => {
    const before = app.get(ClothesService).findOne('1');
    const response = await send('PATCH', '/clothes/1', {});
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), before);
  });

  it('returns 404 for update and delete of a missing record', async () => {
    assert.equal(
      (await send('PATCH', '/clothes/99999', { price: 100 })).status,
      404,
    );
    assert.equal((await send('DELETE', '/clothes/99999')).status, 404);
  });

  it('deletes with 204 and no body, then returns 404 on repeated access', async () => {
    const response = await send('DELETE', '/clothes/1');
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal((await send('GET', '/clothes/1')).status, 404);
    assert.equal((await send('DELETE', '/clothes/1')).status, 404);
    assert.equal(app.get(ClothesService).findAll().length, 2);
  });

  it('does not expose storage through returned service objects', () => {
    const service = app.get(ClothesService);
    const item = service.findOne('1');
    item.price = 0;
    const list = service.findAll();
    list.pop();
    assert.equal(service.findOne('1').price, 1800);
    assert.equal(service.findAll().length, 3);
  });
});
