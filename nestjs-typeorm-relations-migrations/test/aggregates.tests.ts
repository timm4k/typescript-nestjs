import assert from 'node:assert/strict';
import { it } from 'node:test';
import type { TestContext } from './support/test-context.js';
import type { ClothingResponse, PageResponse } from './support/contracts.js';

export function registerAggregateTests(context: TestContext): void {
  const { request, createCollection, createClothing, counts } = context;
  it('creates a full aggregate and cascades new materials into the database', async () => {
    const collection = await createCollection();
    const item = await createClothing(collection.id);
    assert.match(item.id, /^[a-f0-9-]{36}$/);
    assert.equal(item.price, '1800.00');
    assert.equal(item.collection.id, collection.id);
    assert.deepEqual(item.materials.map((material) => material.name).sort(), [
      'Cotton',
      'Polyester',
    ]);
    assert.equal(item.careInstruction.washingTemperature, 30);
    assert.deepEqual(await counts(), {
      clothes: 1,
      materials: 2,
      care: 1,
      links: 2,
    });
  });

  it('loads all related objects through repository relations and QueryBuilder', async () => {
    const item = await createClothing((await createCollection()).id);
    for (const path of [
      `/clothes/${item.id}`,
      `/clothes/${item.id}/aggregate`,
    ]) {
      const response = await request(path);
      assert.equal(response.status, 200);
      const aggregate = (await response.json()) as ClothingResponse;
      assert.equal(aggregate.collection.name, 'Autumn Winter 2026');
      assert.equal(aggregate.materials.length, 2);
      assert.equal(aggregate.careInstruction.id, item.careInstruction.id);
      assert.equal('clothing' in aggregate.careInstruction, false);
    }
  });

  it('shares existing materials between clothes instead of duplicating them', async () => {
    const collection = await createCollection();
    const first = await createClothing(collection.id);
    const second = await createClothing(collection.id, {
      title: 'Cotton T-Shirt',
      materials: ['Cotton'],
    });
    assert.equal(
      second.materials[0]?.id,
      first.materials.find((material) => material.name === 'Cotton')?.id,
    );
    assert.deepEqual(await counts(), {
      clothes: 2,
      materials: 2,
      care: 2,
      links: 3,
    });
  });

  it('filters by material name without losing other materials in the aggregate', async () => {
    const collection = await createCollection();
    await createClothing(collection.id);
    await createClothing(collection.id, {
      title: 'Linen Shirt',
      materials: ['Linen'],
    });
    const response = await request('/clothes?material=COTTON');
    const page = (await response.json()) as PageResponse;
    assert.equal(response.status, 200);
    assert.equal(page.meta.total, 1);
    assert.equal(page.data[0]?.materials.length, 2);
  });

  it('combines collection, material UUID and title filters with bound parameters', async () => {
    const first = await createCollection();
    const second = await createCollection('Spring Summer 2027');
    const item = await createClothing(first.id);
    await createClothing(second.id);
    const materialId = item.materials[0]?.id;
    assert.ok(materialId);
    const page = (await (
      await request(
        `/clothes?collectionId=${first.id}&materialId=${materialId}&search=HOODIE`,
      )
    ).json()) as PageResponse;
    assert.equal(page.meta.total, 1);
    assert.equal(page.data[0]?.id, item.id);
    const injection = (await (
      await request(`/clothes?material=${encodeURIComponent("' OR 1=1 --")}`)
    ).json()) as PageResponse;
    assert.equal(injection.meta.total, 0);
  });

  it('paginates root entities without duplication from many-to-many joins', async () => {
    const collection = await createCollection();
    for (let index = 0; index < 5; index += 1)
      await createClothing(collection.id, { title: `Hoodie ${index}` });
    const ids: string[] = [];
    for (const pageNumber of [1, 2, 3]) {
      const page = (await (
        await request(`/clothes?page=${pageNumber}&limit=2`)
      ).json()) as PageResponse;
      assert.equal(page.meta.total, 5);
      assert.equal(page.meta.totalPages, 3);
      assert.equal(page.data.length, pageNumber === 3 ? 1 : 2);
      assert.ok(page.data.every((item) => item.materials.length === 2));
      ids.push(...page.data.map((item) => item.id));
    }
    assert.equal(new Set(ids).size, 5);
  });
}

export function registerPersistenceTest(context: TestContext): void {
  const { request, createCollection, createClothing } = context;
  it('retains the complete aggregate when the Nest application is restarted', async () => {
    const item = await createClothing((await createCollection()).id);
    await context.app.close();
    await context.startApplication();
    const saved = (await (
      await request(`/clothes/${item.id}/aggregate`)
    ).json()) as ClothingResponse;
    assert.equal(saved.id, item.id);
    assert.equal(saved.collection.id, item.collection.id);
    assert.equal(saved.careInstruction.id, item.careInstruction.id);
    assert.deepEqual(
      saved.materials.map((material) => material.id).sort(),
      item.materials.map((material) => material.id).sort(),
    );
  });
}
