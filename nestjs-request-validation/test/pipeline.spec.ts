import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, test } from 'node:test';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  type ArgumentMetadata,
  type INestApplication,
  type LoggerService,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { ClothesService } from '../src/clothes/clothes.service.js';
import {
  ClothingSize,
  type ClothesListResponse,
  type ClothingEntity,
} from '../src/clothes/clothing.entity.js';
import type { ErrorResponse } from '../src/common/filters/http-exception.filter.js';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { TrimPipe } from '../src/common/pipes/trim.pipe.js';
import { configureApplication } from '../src/configure-application.js';
import type { ArgumentsHost } from '@nestjs/common';

const bodyMetadata: ArgumentMetadata = { type: 'body' };
const validClothing = {
  title: 'Cotton T-Shirt',
  price: 850,
  size: ClothingSize.M,
  material: 'Cotton',
  color: 'Lavender',
};

test('TrimPipe trims primitives, recursively copies objects and traverses arrays', () => {
  const pipe = new TrimPipe();
  assert.equal(pipe.transform('  hello  ', bodyMetadata), 'hello');
  const input = {
    title: '  Shirt ',
    details: { tags: [' cotton ', { color: ' gray ' }] },
    amount: 15,
    available: true,
    missing: null,
  };
  assert.deepEqual(pipe.transform(input, bodyMetadata), {
    title: 'Shirt',
    details: { tags: ['cotton', { color: 'gray' }] },
    amount: 15,
    available: true,
    missing: null,
  });
  assert.equal(input.title, '  Shirt ');
  assert.equal(input.details.tags[0], ' cotton ');
  assert.equal(pipe.transform(undefined, bodyMetadata), undefined);
});

test('TrimPipe preserves non-plain objects and rejects excessive nesting', () => {
  const pipe = new TrimPipe();
  const date = new Date();
  assert.equal(pipe.transform(date, bodyMetadata), date);
  let nested: unknown = ' x ';
  for (let index = 0; index < 66; index++) {
    nested = { child: nested };
  }
  assert.throws(
    () => pipe.transform(nested, bodyMetadata),
    BadRequestException,
  );
});

test('TrimPipe does not promote prototype-shaped JSON keys into object prototypes', () => {
  const pipe = new TrimPipe();
  const input: unknown = JSON.parse(
    '{"__proto__":{"polluted":" yes "},"title":" Shirt "}',
  );
  const result = pipe.transform(input, bodyMetadata);
  assert.ok(typeof result === 'object' && result !== null);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.hasOwn(result, '__proto__'), true);
});

test('exception filter normalizes string HttpException responses into message arrays', () => {
  let status: number | undefined;
  let payload: unknown;
  const response = {
    status(value: number) {
      status = value;
      return this;
    },
    json(value: unknown) {
      payload = value;
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ originalUrl: '/example', method: 'GET' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  new GlobalExceptionFilter().catch(
    new HttpException('Custom conflict', HttpStatus.CONFLICT),
    host,
  );
  assert.equal(status, 409);
  const body = payload as ErrorResponse;
  assert.equal(body.success, false);
  assert.equal(body.error, 'Conflict');
  assert.deepEqual(body.message, ['Custom conflict']);
});

describe('Request pipeline HTTP API', () => {
  let app: INestApplication;
  let baseUrl: string;
  let logs: string[];

  beforeEach(async () => {
    logs = [];
    const logger: LoggerService = {
      log(message: unknown): void {
        logs.push(String(message));
      },
      error(message: unknown): void {
        logs.push(`ERROR ${String(message)}`);
      },
      warn(message: unknown): void {
        logs.push(`WARN ${String(message)}`);
      },
    };
    app = await NestFactory.create(AppModule, { logger: false });
    app.useLogger(logger);
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    logs.length = 0;
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

  async function assertError(
    response: Response,
    statusCode: number,
    path: string,
    method: string,
  ): Promise<ErrorResponse> {
    assert.equal(response.status, statusCode);
    const body = (await response.json()) as ErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.statusCode, statusCode);
    assert.equal(body.path, path);
    assert.equal(body.method, method);
    assert.ok(Number.isFinite(Date.parse(body.timestamp)));
    assert.ok(Array.isArray(body.message));
    assert.ok(body.message.length > 0);
    assert.equal(body.error, statusCode === 400 ? 'Bad Request' : 'Not Found');
    return body;
  }

  function assertTiming(response: Response): void {
    assert.match(
      response.headers.get('x-response-time') ?? '',
      /^\d+\.\d{2}ms$/,
    );
  }

  it('trims all text before validation and returns a created DTO with timing', async () => {
    const response = await send('POST', '/clothes', {
      ...validClothing,
      title: '  Cotton T-Shirt  ',
      size: ' M ',
      material: ' Cotton ',
      color: ' Lavender ',
    });
    assert.equal(response.status, 201);
    assertTiming(response);
    const item = (await response.json()) as ClothingEntity;
    assert.deepEqual(item, { ...validClothing, id: item.id });
    assert.match(item.id, /^[0-9a-f-]{36}$/);
    assert.equal(app.get(ClothesService).findAll().meta.total, 4);
  });

  it('rejects forbidden fields and returns detailed unified errors without mutation', async () => {
    const response = await send('POST', '/clothes', {
      ...validClothing,
      hackerField: 'malicious',
    });
    assertTiming(response);
    const body = await assertError(response, 400, '/clothes', 'POST');
    assert.ok(body.message.includes('property hackerField should not exist'));
    assert.equal(app.get(ClothesService).findAll().meta.total, 3);
  });

  for (const price of [-1, 0, '850', null, 1.234]) {
    it(`rejects invalid price ${JSON.stringify(price)} with detailed validation errors`, async () => {
      const response = await send('POST', '/clothes', {
        ...validClothing,
        price,
      });
      const body = await assertError(response, 400, '/clothes', 'POST');
      assert.ok(body.message.some((message) => message.startsWith('price ')));
      assert.equal(app.get(ClothesService).findAll().meta.total, 3);
    });
  }

  for (const patch of [
    { size: 'XXL' },
    { size: 42 },
    { title: '   ' },
    { material: '  ' },
    { color: false },
  ]) {
    it(`validates variant-specific fields ${JSON.stringify(patch)}`, async () => {
      await assertError(
        await send('POST', '/clothes', { ...validClothing, ...patch }),
        400,
        '/clothes',
        'POST',
      );
    });
  }

  it('rejects missing DTO fields and array payloads', async () => {
    await assertError(
      await send('POST', '/clothes', { title: 'Only title' }),
      400,
      '/clothes',
      'POST',
    );
    await assertError(
      await send('POST', '/clothes', []),
      400,
      '/clothes',
      'POST',
    );
  });

  it('transforms query limit into a number and limits results', async () => {
    const response = await send('GET', '/clothes?limit=5');
    assert.equal(response.status, 200);
    assertTiming(response);
    const body = (await response.json()) as ClothesListResponse;
    assert.equal(body.meta.limit, 5);
    assert.equal(typeof body.meta.limit, 'number');
    assert.equal(body.items.length, 3);
    const limited = (await (
      await send('GET', '/clothes?limit=1')
    ).json()) as ClothesListResponse;
    assert.equal(limited.items.length, 1);
    assert.equal(limited.meta.total, 3);
  });

  for (const limit of ['0', '-1', '1.5', 'abc', '1001', '']) {
    it(`rejects invalid query limit ${JSON.stringify(limit)}`, async () => {
      const path = `/clothes?limit=${encodeURIComponent(limit)}`;
      await assertError(await send('GET', path), 400, path, 'GET');
    });
  }

  it('rejects unknown query fields and repeated scalar query values', async () => {
    await assertError(
      await send('GET', '/clothes?hackerField=x'),
      400,
      '/clothes?hackerField=x',
      'GET',
    );
    await assertError(
      await send('GET', '/clothes?limit=1&limit=2'),
      400,
      '/clothes?limit=1&limit=2',
      'GET',
    );
  });

  it('logs completed successful and failed requests with status, duration and client IP', async () => {
    const response = await send('GET', '/clothes?limit=1');
    await response.text();
    await assertError(
      await send('GET', '/clothes/missing'),
      404,
      '/clothes/missing',
      'GET',
    );
    assert.ok(
      logs.some((line) =>
        /^GET \/clothes\?limit=1 200 \+\d+\.\d{2}ms \[127\.0\.0\.1\]$/.test(
          line,
        ),
      ),
    );
    assert.ok(
      logs.some((line) =>
        /^GET \/clothes\/missing 404 \+\d+\.\d{2}ms \[127\.0\.0\.1\]$/.test(
          line,
        ),
      ),
    );
    assert.ok(
      logs.some((line) =>
        /^GET \/clothes\?limit=1 completed in \d+\.\d{2}ms$/.test(line),
      ),
    );
    assert.equal(
      logs.some((line) => line.includes('Cotton blend')),
      false,
    );
  });

  it('logs unmatched routes including the root and applies the global error filter', async () => {
    await assertError(await send('GET', '/'), 404, '/', 'GET');
    await assertError(
      await send('GET', '/not-a-route'),
      404,
      '/not-a-route',
      'GET',
    );
    assert.ok(logs.some((line) => line.startsWith('GET / 404 +')));
    assert.ok(logs.some((line) => line.startsWith('GET /not-a-route 404 +')));
  });

  it('supports optional PATCH fields, sanitation and unchanged values for omitted or null fields', async () => {
    const response = await send('PATCH', '/clothes/1', {
      color: ' Black ',
      title: null,
    });
    assert.equal(response.status, 200);
    assertTiming(response);
    const item = (await response.json()) as ClothingEntity;
    assert.equal(item.title, 'Sweat Oversized Pullover Hoodie');
    assert.equal(item.color, 'Black');
    assert.equal(item.price, 1800);
    assert.equal(item.id, '1');
    const empty = await send('PATCH', '/clothes/1', {});
    assert.deepEqual(await empty.json(), item);
  });

  it('rejects invalid PATCH fields without changing the original item', async () => {
    const before = app.get(ClothesService).findOne('1');
    for (const patch of [
      { price: '850' },
      { material: '   ' },
      { size: 'XXL' },
      { id: 'changed' },
    ]) {
      await assertError(
        await send('PATCH', '/clothes/1', patch),
        400,
        '/clothes/1',
        'PATCH',
      );
    }
    assert.deepEqual(app.get(ClothesService).findOne('1'), before);
  });

  it('keeps GET bodies unchanged and adds timing to GET and DELETE responses', async () => {
    const response = await send('GET', '/clothes/1');
    assert.equal(response.status, 200);
    assertTiming(response);
    const item = (await response.json()) as ClothingEntity;
    assert.equal(item.id, '1');
    assert.equal(Object.hasOwn(item, 'responseTime'), false);
    const deleted = await send('DELETE', '/clothes/1');
    assert.equal(deleted.status, 204);
    assertTiming(deleted);
    assert.equal(await deleted.text(), '');
    await assertError(
      await send('GET', '/clothes/1'),
      404,
      '/clothes/1',
      'GET',
    );
  });
});
