import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countClothingByStatus,
  createClothing,
  summarizeClothing,
} from "../src/clothing.js";
import type { ClothingEntity } from "../src/types/clothing-entity.js";
import type { CreateDto } from "../src/types/dto.js";
import { EntityStatus } from "../src/types/entity-status.js";

function dto(
  overrides: Partial<CreateDto<ClothingEntity>> = {},
): CreateDto<ClothingEntity> {
  return {
    title: " Sweat Wide Pants ",
    price: 2100,
    size: "XS",
    material: " Cotton blend ",
    color: " Gray ",
    status: EntityStatus.Draft,
    ...overrides,
  };
}

test("creation from a DTO generates system fields and cleans text", () => {
  const input = dto();
  const first = createClothing(input);
  const second = createClothing(input);
  assert.notEqual(first.id, second.id);
  assert.ok(first.createdAt instanceof Date);
  assert.deepEqual(first.createdAt, first.updatedAt);
  assert.equal(first.title, "Sweat Wide Pants");
  assert.equal(first.material, "Cotton blend");
  assert.equal(first.color, "Gray");
  assert.equal(input.title, " Sweat Wide Pants ");
});

test("creation rejects negative and non-finite prices and empty text", () => {
  for (const price of [-1, NaN, Infinity]) {
    assert.throws(() => createClothing(dto({ price })), RangeError);
  }
  for (const key of ["title", "material", "color"] as const) {
    assert.throws(() => createClothing(dto({ [key]: " " })));
  }
  assert.equal(createClothing(dto({ price: 0 })).price, 0);
});

test("summaries contain exactly the fields selected by Pick", () => {
  const item = createClothing(dto());
  assert.deepEqual(summarizeClothing(item), {
    id: item.id,
    title: item.title,
    price: item.price,
  });
});

test("status analytics includes zero counters and counts all enum values", () => {
  assert.deepEqual(countClothingByStatus([]), {
    ACTIVE: 0,
    ARCHIVED: 0,
    DRAFT: 0,
  });
  const items = [
    EntityStatus.Active,
    EntityStatus.Active,
    EntityStatus.Archived,
    EntityStatus.Draft,
  ].map((status) => createClothing(dto({ status })));
  assert.deepEqual(countClothingByStatus(items), {
    ACTIVE: 2,
    ARCHIVED: 1,
    DRAFT: 1,
  });
});
