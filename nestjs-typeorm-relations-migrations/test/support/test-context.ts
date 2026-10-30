import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, beforeEach } from 'node:test';
import { Module, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClothesModule } from '../../src/clothes/clothes.module.js';
import { CollectionsModule } from '../../src/collections/collections.module.js';
import { configureApplication } from '../../src/configure-application.js';
import { getDatabaseOptions } from '../../src/database/database.config.js';
import { CreateCollectionsAndClothes1793321012890 } from '../../src/database/migrations/1793321012890-CreateCollectionsAndClothes.js';
import { AddMaterials1793321049672 } from '../../src/database/migrations/1793321049672-AddMaterials.js';
import { AddCareInstructions1793321100412 } from '../../src/database/migrations/1793321100412-AddCareInstructions.js';
import type {
  CollectionResponse,
  ClothingResponse,
  Counts,
} from './contracts.js';

export function createTestContext() {
  const databaseName = `test_relations_${randomUUID().replaceAll('-', '')}`;

  const options = {
    ...getDatabaseOptions(),
    database: databaseName,
    logging: false as const,
    migrations: [
      CreateCollectionsAndClothes1793321012890,
      AddMaterials1793321049672,
      AddCareInstructions1793321100412,
    ],
  };

  let admin: DataSource;

  let app: INestApplication;

  let database: DataSource;

  let baseUrl: string;

  async function startApplication(): Promise<void> {
    @Module({
      imports: [
        TypeOrmModule.forRoot({ ...options, retryAttempts: 1 }),
        ClothesModule,
        CollectionsModule,
      ],
    })
    class TestModule {}
    app = await NestFactory.create(TestModule, { logger: false });
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    database = app.get(DataSource);
  }

  async function request(
    path: string,
    method = 'GET',
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

  async function createCollection(
    name = 'Autumn Winter 2026',
  ): Promise<CollectionResponse> {
    const response = await request('/collections', 'POST', { name });
    assert.equal(response.status, 201);
    return response.json() as Promise<CollectionResponse>;
  }

  function payload(
    collectionId: string,
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      title: 'Cotton Hoodie',
      price: 1800,
      size: 'M',
      color: 'Gray',
      collectionId,
      materials: ['Cotton', 'Polyester'],
      careInstruction: {
        washingTemperature: 30,
        dryCleanOnly: false,
        instructions: 'Wash inside out',
      },
      ...overrides,
    };
  }

  async function createClothing(
    collectionId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<ClothingResponse> {
    const response = await request(
      '/clothes',
      'POST',
      payload(collectionId, overrides),
    );
    assert.equal(response.status, 201, await response.clone().text());
    return response.json() as Promise<ClothingResponse>;
  }

  async function counts(): Promise<Counts> {
    const rows: Counts[] = await database.query(`SELECT
      (SELECT COUNT(*)::int FROM clothes) AS clothes,
      (SELECT COUNT(*)::int FROM materials) AS materials,
      (SELECT COUNT(*)::int FROM care_instructions) AS care,
      (SELECT COUNT(*)::int FROM clothing_materials) AS links`);
    assert.ok(rows[0]);
    return rows[0];
  }

  before(async () => {
    assert.match(databaseName, /^test_relations_[a-f0-9]{32}$/);
    admin = await new DataSource({
      ...getDatabaseOptions(),
      logging: false,
    }).initialize();
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    const migrationSource = await new DataSource(options).initialize();
    try {
      assert.equal((await migrationSource.runMigrations()).length, 3);
    } finally {
      await migrationSource.destroy();
    }
    await startApplication();
  });

  beforeEach(async () => {
    assert.equal(database.options.database, databaseName);
    await database.query('TRUNCATE TABLE collections, materials CASCADE');
  });

  after(async () => {
    try {
      if (app !== undefined) await app.close();
      if (admin?.isInitialized) {
        assert.match(databaseName, /^test_relations_[a-f0-9]{32}$/);
        await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      }
    } finally {
      if (admin?.isInitialized) await admin.destroy();
    }
  });
  return {
    get database() {
      return database;
    },
    get app() {
      return app;
    },
    startApplication,
    request,
    createCollection,
    payload,
    createClothing,
    counts,
  };
}

export type TestContext = ReturnType<typeof createTestContext>;
