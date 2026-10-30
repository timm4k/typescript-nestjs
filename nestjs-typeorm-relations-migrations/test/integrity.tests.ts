import assert from 'node:assert/strict';
import { it } from 'node:test';
import type { TestContext } from './support/test-context.js';
import { randomUUID } from 'node:crypto';
import type { ClothingResponse } from './support/contracts.js';

export function registerIntegrityTests(context: TestContext): void {
  const { request, createCollection, createClothing, counts } = context;
  it('deletes dependent care and junction rows while retaining shared materials', async () => {
    const collection = await createCollection();
    const first = await createClothing(collection.id);
    const second = await createClothing(collection.id);
    const response = await request(`/clothes/${first.id}`, 'DELETE');
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.deepEqual(await counts(), {
      clothes: 1,
      materials: 2,
      care: 1,
      links: 2,
    });
    assert.equal((await request(`/clothes/${second.id}`)).status, 200);
  });

  it('cascades collection deletion through clothes, care instructions and junction rows', async () => {
    const collection = await createCollection();
    await createClothing(collection.id);
    await createClothing(collection.id);
    assert.equal(
      (await request(`/collections/${collection.id}`, 'DELETE')).status,
      204,
    );
    assert.deepEqual(await counts(), {
      clothes: 0,
      materials: 2,
      care: 0,
      links: 0,
    });
  });

  it('enforces one care instruction per clothing through a unique foreign key', async () => {
    const item = await createClothing((await createCollection()).id);
    await assert.rejects(
      context.database.query(
        'INSERT INTO care_instructions ("washingTemperature", "dryCleanOnly", instructions, clothing_id) VALUES (30, false, $1, $2)',
        ['Duplicate care', item.id],
      ),
      (error: unknown) =>
        error instanceof Error && error.message.includes('duplicate key'),
    );
    assert.equal((await counts()).care, 1);
  });

  it('preserves existing data when an update references a missing collection', async () => {
    const item = await createClothing((await createCollection()).id);
    const response = await request(`/clothes/${item.id}`, 'PATCH', {
      price: 100,
      collectionId: randomUUID(),
    });
    assert.equal(response.status, 404);
    const unchanged = (await (
      await request(`/clothes/${item.id}`)
    ).json()) as ClothingResponse;
    assert.equal(unchanged.price, item.price);
    assert.equal(unchanged.collection.id, item.collection.id);
  });
}
