import { randomUUID } from "node:crypto";
import type { ClothingEntity } from "./types/clothing-entity.js";
import type { CreateDto, EntityAnalytics, EntitySummary } from "./types/dto.js";
import { EntityStatus } from "./types/entity-status.js";

export function createClothing(
  data: CreateDto<ClothingEntity>,
): ClothingEntity {
  if (!Number.isFinite(data.price) || data.price < 0) {
    throw new RangeError("Price must be a finite non-negative number");
  }
  for (const value of [data.title, data.material, data.color]) {
    if (value.trim().length === 0) {
      throw new Error("Clothing text fields must not be empty");
    }
  }
  const now = new Date();
  return {
    ...data,
    title: data.title.trim(),
    material: data.material.trim(),
    color: data.color.trim(),
    id: randomUUID(),
    createdAt: now,
    updatedAt: new Date(now),
  };
}

export function summarizeClothing(
  item: ClothingEntity,
): EntitySummary<ClothingEntity> {
  return { id: item.id, title: item.title, price: item.price };
}

export function countClothingByStatus(
  items: readonly ClothingEntity[],
): EntityAnalytics<ClothingEntity> {
  const counts: EntityAnalytics<ClothingEntity> = {
    [EntityStatus.Active]: 0,
    [EntityStatus.Archived]: 0,
    [EntityStatus.Draft]: 0,
  };
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}
