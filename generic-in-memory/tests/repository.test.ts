import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryRepository } from "../src/repositories/in-memory-repository.js";
import type { IRepository } from "../src/repositories/repository.js";
import type { BaseEntity } from "../src/types/base-entity.js";
import type { UpdateDto } from "../src/types/dto.js";

interface SampleEntity extends BaseEntity {
  title: string;
  details: { tags: string[] };
}

function fixture(id = "sample-1"): SampleEntity {
  return {
    id,
    title: "Original",
    details: { tags: ["clothing"] },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

test("an empty repository follows the missing-entity contract", () => {
  const repository: IRepository<SampleEntity> = new InMemoryRepository();
  assert.deepEqual(repository.findAll(), []);
  assert.equal(repository.findById("missing"), null);
  assert.equal(repository.update("missing", { title: "Changed" }), null);
  assert.equal(repository.deleteById("missing"), false);
});

test("create and find operations preserve all fields and Date values", () => {
  const repository = new InMemoryRepository<SampleEntity>();
  const input = fixture();
  assert.deepEqual(repository.create(input), input);
  assert.deepEqual(repository.findById(input.id), input);
  assert.deepEqual(repository.findAll(), [input]);
  assert.ok(repository.findById(input.id)?.createdAt instanceof Date);
});

test("create rejects duplicate IDs, blank IDs and invalid timestamps", () => {
  const repository = new InMemoryRepository<SampleEntity>();
  repository.create(fixture());
  assert.throws(() => repository.create(fixture()), /already exists/);
  assert.throws(() => repository.create(fixture(" ")), /must not be empty/);
  assert.throws(() =>
    repository.create({ ...fixture("other"), updatedAt: new Date(NaN) }),
  );
  assert.equal(repository.findAll().length, 1);
});

test("input objects and all returned values are isolated from stored state", () => {
  const repository = new InMemoryRepository<SampleEntity>();
  const input = fixture();
  const result = repository.create(input);
  input.details.tags.push("input");
  result.details.tags.push("result");
  result.createdAt.setFullYear(2000);
  const found = repository.findById(input.id);
  assert.ok(found);
  found.details.tags.push("findById");
  const list = repository.findAll();
  list[0]?.details.tags.push("findAll");
  list.pop();
  assert.deepEqual(repository.findById(input.id), fixture());
});

test("update changes only supplied fields and refreshes updatedAt", () => {
  const repository = new InMemoryRepository<SampleEntity>();
  const original = repository.create(fixture());
  const start = Date.now();
  const result = repository.update(original.id, { title: "Changed" });
  assert.ok(result);
  assert.equal(result.title, "Changed");
  assert.equal(result.id, original.id);
  assert.deepEqual(result.createdAt, original.createdAt);
  assert.deepEqual(result.details, original.details);
  assert.ok(result.updatedAt.getTime() >= start);
  assert.ok(result.updatedAt.getTime() <= Date.now());
  assert.equal(original.title, "Original");
});

test("update protects system fields even when a wider object supplies them", () => {
  const repository = new InMemoryRepository<SampleEntity>();
  const original = repository.create(fixture());
  const patch = {
    title: "Changed",
    id: "replacement",
    createdAt: new Date("2000-01-01"),
    updatedAt: new Date("2000-01-01"),
  } satisfies UpdateDto<SampleEntity> & BaseEntity;
  const result = repository.update(original.id, patch);
  assert.ok(result);
  assert.equal(result.id, original.id);
  assert.deepEqual(result.createdAt, original.createdAt);
  assert.notDeepEqual(result.updatedAt, patch.updatedAt);
  assert.equal(repository.findById("replacement"), null);
});

test("update snapshots nested patches and does not expose stored values", () => {
  const repository = new InMemoryRepository<SampleEntity>();
  const original = repository.create(fixture());
  const patch: UpdateDto<SampleEntity> = { details: { tags: ["new"] } };
  const result = repository.update(original.id, patch);
  assert.ok(result);
  patch.details?.tags.push("outside");
  result.details.tags.push("returned");
  assert.deepEqual(repository.findById(original.id)?.details.tags, ["new"]);
});

test("delete removes only the selected entity and repeated deletion returns false", () => {
  const repository = new InMemoryRepository<SampleEntity>();
  repository.create(fixture("first"));
  repository.create(fixture("second"));
  assert.equal(repository.deleteById("first"), true);
  assert.equal(repository.deleteById("first"), false);
  assert.equal(repository.findById("first"), null);
  assert.equal(repository.findAll()[0]?.id, "second");
});
