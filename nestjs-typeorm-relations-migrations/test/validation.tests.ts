import assert from 'node:assert/strict';
import { it } from 'node:test';
import type { TestContext } from './support/test-context.js';
import { randomUUID } from 'node:crypto';

export function registerValidationTests(context: TestContext): void {
  const { request, createCollection, payload, createClothing, counts } =
    context;
  it('rejects an unknown collection without leaving partial data', async () => {
    assert.equal(
      (await request('/clothes', 'POST', payload(randomUUID()))).status,
      404,
    );
    assert.deepEqual(await counts(), {
      clothes: 0,
      materials: 0,
      care: 0,
      links: 0,
    });
  });

  it('returns conflict for duplicate collection names', async () => {
    await createCollection();
    assert.equal(
      (await request('/collections', 'POST', { name: 'Autumn Winter 2026' }))
        .status,
      409,
    );
  });

  it('trims nested text and material names before validation', async () => {
    const item = await createClothing(
      (await createCollection('  Autumn  ')).id,
      {
        title: '  Hoodie  ',
        materials: ['  Cotton  '],
        careInstruction: {
          washingTemperature: 30,
          dryCleanOnly: false,
          instructions: '  Wash gently  ',
        },
      },
    );
    assert.equal(item.title, 'Hoodie');
    assert.equal(item.collection.name, 'Autumn');
    assert.equal(item.materials[0]?.name, 'Cotton');
    assert.equal(item.careInstruction.instructions, 'Wash gently');
  });

  for (const invalid of [
    { price: -1 },
    { price: '1800' },
    { size: 'XXL' },
    { materials: [] },
    { materials: ['Cotton', ' Cotton '] },
    { materials: [false] },
    { careInstruction: null },
    { careInstruction: [] },
    { careInstruction: { washingTemperature: 200 } },
    { id: randomUUID() },
    { simulateFailure: true },
  ]) {
    it(`rejects invalid creation data ${JSON.stringify(invalid)}`, async () => {
      const collection = await createCollection();
      assert.equal(
        (await request('/clothes', 'POST', payload(collection.id, invalid)))
          .status,
        400,
      );
      assert.deepEqual(await counts(), {
        clothes: 0,
        materials: 0,
        care: 0,
        links: 0,
      });
    });
  }

  it('returns 400 for invalid filters and 404 for unknown valid identifiers', async () => {
    for (const query of [
      'page=0',
      'limit=101',
      'materialId=bad',
      'collectionId=bad',
      'unknown=true',
    ]) {
      assert.equal((await request(`/clothes?${query}`)).status, 400);
    }
    assert.equal((await request('/clothes/bad')).status, 400);
    const id = randomUUID();
    assert.equal((await request(`/clothes/${id}`)).status, 404);
    assert.equal((await request(`/clothes/${id}/aggregate`)).status, 404);
    assert.equal(
      (await request(`/clothes/${id}`, 'PATCH', { price: 100 })).status,
      404,
    );
    assert.equal((await request(`/clothes/${id}`, 'DELETE')).status, 404);
  });
}
