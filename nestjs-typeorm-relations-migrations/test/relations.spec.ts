import 'reflect-metadata';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDatabaseOptions } from '../src/database/database.config.js';
import { createTestContext } from './support/test-context.js';
import { registerMigrationTests } from './migrations.tests.js';
import {
  registerAggregateTests,
  registerPersistenceTest,
} from './aggregates.tests.js';
import { registerTransactionTests } from './transactions.tests.js';
import { registerIntegrityTests } from './integrity.tests.js';
import { registerValidationTests } from './validation.tests.js';

it('keeps synchronization and automatic migration execution disabled', () => {
  const options = getDatabaseOptions({ POSTGRES_PASSWORD: 'test-only' });
  assert.equal(options.synchronize, false);
  assert.equal(options.migrationsRun, false);
  assert.throws(() => getDatabaseOptions({}), /POSTGRES_PASSWORD/);
  assert.throws(
    () =>
      getDatabaseOptions({ POSTGRES_PASSWORD: 'test-only', DB_PORT: 'bad' }),
    /DB_PORT/,
  );
});

describe('PostgreSQL relations, migrations and transactions', () => {
  const context = createTestContext();
  registerMigrationTests(context);
  registerAggregateTests(context);
  registerTransactionTests(context);
  registerIntegrityTests(context);
  registerValidationTests(context);
  registerPersistenceTest(context);
});
