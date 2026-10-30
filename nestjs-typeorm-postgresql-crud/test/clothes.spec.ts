import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  after,
  afterEach,
  before,
  beforeEach,
  describe,
  it,
  test,
} from 'node:test';
import {
  Module,
  type DynamicModule,
  type INestApplication,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';
import { ClothesModule } from '../src/clothes/clothes.module.js';
import type { ClothesPage } from '../src/clothes/clothes.service.js';
import {
  ClothingEntity,
  ClothingSize,
} from '../src/clothes/entities/clothing.entity.js';
import { configureApplication } from '../src/configure-application.js';
import { getDatabaseOptions } from '../src/database/database.config.js';

type ClothingResponse = Omit<
  ClothingEntity,
  'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type PageResponse = Omit<ClothesPage, 'data'> & { data: ClothingResponse[] };

const validClothing = {
  title: 'Cotton T-Shirt',
  price: 850,
  size: ClothingSize.M,
  material: 'Cotton',
  color: 'Lavender',
};

test('database configuration requires a private password, validates options and blocks production sync', () => {
  const environment = { POSTGRES_PASSWORD: 'unit-test-placeholder' };
  const options = getDatabaseOptions(environment);
  assert.equal(options.type, 'postgres');
  assert.equal(options.port, 5432);
  assert.equal(options.synchronize, true);
  assert.throws(() => getDatabaseOptions({}), /POSTGRES_PASSWORD/);
  assert.throws(
    () => getDatabaseOptions({ ...environment, DB_PORT: 'abc' }),
    /DB_PORT/,
  );
  assert.throws(
    () => getDatabaseOptions({ ...environment, DB_LOG_SQL: 'yes' }),
    /DB_LOG_SQL/,
  );
  assert.throws(
    () => getDatabaseOptions({ ...environment, NODE_ENV: 'production' }),
    /synchronization/,
  );
});

@Module({})
class IntegrationTestModule {}

describe('PostgreSQL clothes HTTP API', () => {
  const schema = `test_clothes_${randomUUID().replaceAll('-', '')}`;
  let admin: DataSource;
  let app: INestApplication;
  let baseUrl: string;
  let repository: Repository<ClothingEntity>;

  before(async () => {
    admin = new DataSource({
      ...getDatabaseOptions(),
      synchronize: false,
      entities: [],
      logging: false,
    });
    await admin.initialize();
    await admin.query(`CREATE SCHEMA "${schema}"`);
  });

  after(async () => {
    if (admin?.isInitialized) {
      try {
        assert.match(schema, /^test_clothes_[a-f0-9]{32}$/);
        await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      } finally {
        await admin.destroy();
      }
    }
  });

  async function startApplication(): Promise<void> {
    const module: DynamicModule = {
      module: IntegrationTestModule,
      imports: [
        TypeOrmModule.forRoot({
          ...getDatabaseOptions(),
          schema,
          logging: false,
          autoLoadEntities: true,
          retryAttempts: 1,
        }),
        ClothesModule,
      ],
    };
    app = await NestFactory.create(module, { logger: false });
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    repository = app.get(DataSource).getRepository(ClothingEntity);
    assert.equal(repository.metadata.schema, schema);
  }

  beforeEach(async () => {
    await startApplication();
    await repository.clear();
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

  async function create(
    body: unknown = validClothing,
  ): Promise<ClothingResponse> {
    const response = await send('POST', '/clothes', body);
    assert.equal(response.status, 201);
    return (await response.json()) as ClothingResponse;
  }

  async function createSeven(): Promise<void> {
    for (let index = 1; index <= 7; index++) {
      await create({
        ...validClothing,
        title: `Test Item ${index}`,
        price: index * 100,
      });
    }
  }

  it('creates the exact PostgreSQL column types, decimal precision and enum labels', async () => {
    const columns = await admin.query<
      Array<{
        column_name: string;
        data_type: string;
        character_maximum_length: number | null;
        numeric_precision: number | null;
        numeric_scale: number | null;
      }>
    >(
      'SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2',
      [schema, 'clothes'],
    );
    const fields = new Map(
      columns.map((column) => [column.column_name, column]),
    );
    assert.equal(fields.get('id')?.data_type, 'uuid');
    assert.equal(fields.get('title')?.character_maximum_length, 150);
    assert.equal(fields.get('price')?.data_type, 'numeric');
    assert.equal(fields.get('price')?.numeric_precision, 10);
    assert.equal(fields.get('price')?.numeric_scale, 2);
    assert.equal(fields.get('material')?.character_maximum_length, 80);
    assert.equal(fields.get('color')?.character_maximum_length, 50);
    for (const field of ['createdAt', 'updatedAt', 'deletedAt']) {
      assert.equal(fields.get(field)?.data_type, 'timestamp with time zone');
    }
    const labels = await admin.query<Array<{ enumlabel: string }>>(
      'SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = $1 AND t.typname = $2 ORDER BY e.enumsortorder',
      [schema, 'clothing_size'],
    );
    assert.deepEqual(
      labels.map((entry) => entry.enumlabel),
      ['XS', 'S', 'M', 'L', 'XL'],
    );
  });

  it('starts with an empty persistent catalog and default pagination metadata', async () => {
    const response = await send('GET', '/clothes');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
  });

  it('creates through the repository with UUID, exact decimal string and audit dates', async () => {
    const item = await create({
      ...validClothing,
      title: '  Cotton T-Shirt  ',
    });
    assert.match(item.id, /^[0-9a-f-]{36}$/);
    assert.equal(item.title, 'Cotton T-Shirt');
    assert.equal(item.price, '850.00');
    assert.equal(item.deletedAt, null);
    assert.ok(Number.isFinite(Date.parse(item.createdAt)));
    assert.equal(
      (await repository.findOneByOrFail({ id: item.id })).price,
      '850.00',
    );
  });

  it('reads a stored entity and returns 404 for an unknown UUID', async () => {
    const item = await create();
    assert.deepEqual(
      await (await send('GET', `/clothes/${item.id}`)).json(),
      item,
    );
    assert.equal((await send('GET', `/clothes/${randomUUID()}`)).status, 404);
  });

  it('updates only supplied fields and refreshes the audit timestamp', async () => {
    const before = await create();
    const response = await send('PATCH', `/clothes/${before.id}`, {
      price: 790.5,
      color: 'Black',
    });
    assert.equal(response.status, 200);
    const after = (await response.json()) as ClothingResponse;
    assert.equal(after.price, '790.50');
    assert.equal(after.color, 'Black');
    assert.equal(after.title, before.title);
    assert.equal(after.id, before.id);
    assert.equal(after.createdAt, before.createdAt);
    assert.ok(Date.parse(after.updatedAt) >= Date.parse(before.updatedAt));
  });

  it('returns non-overlapping pages for seven persisted records', async () => {
    await createSeven();
    const first = (await (
      await send('GET', '/clothes?page=1&limit=3')
    ).json()) as PageResponse;
    const second = (await (
      await send('GET', '/clothes?page=2&limit=3')
    ).json()) as PageResponse;
    const third = (await (
      await send('GET', '/clothes?page=3&limit=3')
    ).json()) as PageResponse;
    assert.equal(first.data.length, 3);
    assert.equal(second.data.length, 3);
    assert.equal(third.data.length, 1);
    assert.deepEqual(first.meta, {
      total: 7,
      page: 1,
      limit: 3,
      totalPages: 3,
    });
    assert.equal(
      new Set(
        [...first.data, ...second.data, ...third.data].map((item) => item.id),
      ).size,
      7,
    );
    const beyond = (await (
      await send('GET', '/clothes?page=4&limit=3')
    ).json()) as PageResponse;
    assert.equal(beyond.data.length, 0);
    assert.equal(beyond.meta.total, 7);
  });

  it('filters case-insensitively with the filtered count and literal wildcard characters', async () => {
    await create({ ...validClothing, title: 'Sweat Hoodie' });
    await create({ ...validClothing, title: 'Sweat Pants' });
    await create({ ...validClothing, title: '100% Cotton' });
    const filtered = (await (
      await send('GET', '/clothes?search=SWEAT&limit=1')
    ).json()) as PageResponse;
    assert.equal(filtered.meta.total, 2);
    assert.equal(filtered.data.length, 1);
    const literal = (await (
      await send('GET', '/clothes?search=%25')
    ).json()) as PageResponse;
    assert.equal(literal.meta.total, 1);
    assert.equal(literal.data[0]?.title, '100% Cotton');
    const injection = (await (
      await send('GET', `/clothes?search=${encodeURIComponent("' OR 1=1 --")}`)
    ).json()) as PageResponse;
    assert.equal(injection.meta.total, 0);
  });

  it('sorts decimal prices numerically in both directions', async () => {
    for (const price of [2, 10, 9]) {
      await create({ ...validClothing, price });
    }
    const ascending = (await (
      await send('GET', '/clothes?sortBy=price&order=ASC')
    ).json()) as PageResponse;
    const descending = (await (
      await send('GET', '/clothes?sortBy=price&order=DESC')
    ).json()) as PageResponse;
    assert.deepEqual(
      ascending.data.map((item) => item.price),
      ['2.00', '9.00', '10.00'],
    );
    assert.deepEqual(
      descending.data.map((item) => item.price),
      ['10.00', '9.00', '2.00'],
    );
  });

  it('soft-deletes without physically removing the row and excludes it from queries', async () => {
    const item = await create();
    const response = await send('DELETE', `/clothes/${item.id}`);
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(await repository.count(), 0);
    const stored = await repository.findOne({
      where: { id: item.id },
      withDeleted: true,
    });
    assert.ok(stored?.deletedAt instanceof Date);
    const page = (await (await send('GET', '/clothes')).json()) as PageResponse;
    assert.equal(page.meta.total, 0);
    assert.equal((await send('GET', `/clothes/${item.id}`)).status, 404);
    assert.equal(
      (await send('PATCH', `/clothes/${item.id}`, { price: 100 })).status,
      404,
    );
    assert.equal((await send('DELETE', `/clothes/${item.id}`)).status, 404);
  });

  it('restores the original row and supports repeated restoration of an active entity', async () => {
    const item = await create();
    await send('DELETE', `/clothes/${item.id}`);
    const response = await send('PATCH', `/clothes/${item.id}/restore`);
    assert.equal(response.status, 200);
    const restored = (await response.json()) as ClothingResponse;
    assert.equal(restored.id, item.id);
    assert.equal(restored.createdAt, item.createdAt);
    assert.equal(restored.deletedAt, null);
    assert.equal(await repository.count(), 1);
    assert.equal(
      (await send('PATCH', `/clothes/${item.id}/restore`)).status,
      200,
    );
    assert.equal(
      (await send('PATCH', `/clothes/${randomUUID()}/restore`)).status,
      404,
    );
  });

  it('retains records after closing and reopening the entire Nest application', async () => {
    const item = await create();
    await app.close();
    await startApplication();
    const response = await send('GET', `/clothes/${item.id}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), item);
  });

  for (const query of [
    'page=0',
    'page=1.5',
    'limit=0',
    'limit=101',
    'limit=abc',
    'sortBy=password',
    'order=invalid',
    'unknown=x',
  ]) {
    it(`rejects invalid pagination or sorting ${query}`, async () => {
      assert.equal((await send('GET', `/clothes?${query}`)).status, 400);
    });
  }

  it('rejects invalid UUIDs before database lookup', async () => {
    assert.equal((await send('GET', '/clothes/not-a-uuid')).status, 400);
    assert.equal(
      (await send('PATCH', '/clothes/not-a-uuid/restore')).status,
      400,
    );
  });

  it('validates price bounds, exact column lengths and server-managed fields', async () => {
    for (const patch of [
      { price: 0 },
      { price: -1 },
      { price: 100_000_000 },
      { price: '850' },
      { price: 1.234 },
      { title: 'a'.repeat(151) },
      { material: 'a'.repeat(81) },
      { color: 'a'.repeat(51) },
      { size: 'XXL' },
      { deletedAt: null },
      { id: randomUUID() },
    ]) {
      assert.equal(
        (await send('POST', '/clothes', { ...validClothing, ...patch })).status,
        400,
      );
    }
    assert.equal(await repository.count(), 0);
    const maximum = await create({ ...validClothing, price: 99_999_999.99 });
    assert.equal(maximum.price, '99999999.99');
  });

  it('rejects null and system fields in PATCH without changing the row', async () => {
    const item = await create();
    for (const patch of [
      { price: null },
      { title: null },
      { id: randomUUID() },
      { deletedAt: null },
    ]) {
      assert.equal(
        (await send('PATCH', `/clothes/${item.id}`, patch)).status,
        400,
      );
    }
    assert.deepEqual(
      await (await send('GET', `/clothes/${item.id}`)).json(),
      item,
    );
  });
});
