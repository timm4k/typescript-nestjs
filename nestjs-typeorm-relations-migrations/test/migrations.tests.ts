import assert from 'node:assert/strict';
import { it } from 'node:test';
import type { TestContext } from './support/test-context.js';

export function registerMigrationTests(context: TestContext): void {
  it('runs generated migrations, reverts both additional migrations and applies them again', async () => {
    assert.equal(await context.database.showMigrations(), false);
    await context.database.undoLastMigration();
    let rows: Array<{ table_name: string | null }> =
      await context.database.query(
        "SELECT to_regclass('public.care_instructions')::text AS table_name",
      );
    assert.equal(rows[0]?.table_name, null);
    await context.database.undoLastMigration();
    rows = await context.database.query(
      "SELECT to_regclass('public.materials')::text AS table_name",
    );
    assert.equal(rows[0]?.table_name, null);
    assert.equal((await context.database.runMigrations()).length, 2);
    assert.equal(await context.database.showMigrations(), false);
    const schemaChanges = await context.database.driver
      .createSchemaBuilder()
      .log();
    assert.deepEqual(schemaChanges.upQueries, []);
    assert.deepEqual(schemaChanges.downQueries, []);
  });
}
