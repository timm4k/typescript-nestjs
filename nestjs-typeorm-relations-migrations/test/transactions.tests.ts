import assert from 'node:assert/strict';
import { it } from 'node:test';
import type { TestContext } from './support/test-context.js';
import type { ClothingResponse } from './support/contracts.js';
import { ClothingEntity } from '../src/clothes/entities/clothing.entity.js';

export function registerTransactionTests(context: TestContext): void {
  const { request, createCollection, payload, createClothing, counts } =
    context;
  it('rolls back clothing, new materials, junction rows and care on a simulated mid-transaction failure', async () => {
    const collection = await createCollection();
    await createClothing(collection.id);
    const beforeCounts = await counts();
    const response = await request(
      '/clothes/transactional',
      'POST',
      payload(collection.id, {
        title: 'Rollback Sample',
        materials: ['Rollback Fabric'],
        simulateFailure: true,
      }),
    );
    assert.equal(response.status, 400);
    assert.match(await response.text(), /after saving clothing and materials/);
    assert.deepEqual(await counts(), beforeCounts);
    assert.equal(
      await context.database
        .getRepository(ClothingEntity)
        .countBy({ title: 'Rollback Sample' }),
      0,
    );
  });

  it('commits the same transactional endpoint when failure simulation is disabled', async () => {
    const response = await request(
      '/clothes/transactional',
      'POST',
      payload((await createCollection()).id, { simulateFailure: false }),
    );
    assert.equal(response.status, 201);
    assert.deepEqual(await counts(), {
      clothes: 1,
      materials: 2,
      care: 1,
      links: 2,
    });
  });

  it('updates linked entities atomically and preserves audit identity', async () => {
    const item = await createClothing((await createCollection()).id);
    const response = await request(`/clothes/${item.id}`, 'PATCH', {
      price: 1650,
      materials: ['Cotton', 'Linen'],
      careInstruction: {
        washingTemperature: 20,
        dryCleanOnly: false,
        instructions: 'Hand wash',
      },
    });
    assert.equal(response.status, 200);
    const updated = (await response.json()) as ClothingResponse;
    assert.equal(updated.price, '1650.00');
    assert.equal(updated.id, item.id);
    assert.equal(updated.createdAt, item.createdAt);
    assert.equal(updated.careInstruction.id, item.careInstruction.id);
    assert.equal(updated.careInstruction.instructions, 'Hand wash');
    assert.deepEqual(
      updated.materials.map((material) => material.name).sort(),
      ['Cotton', 'Linen'],
    );
  });
}
