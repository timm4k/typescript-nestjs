import type { BaseEntity } from "../types/base-entity.js";
import type { UpdateDto } from "../types/dto.js";
import type { IRepository } from "./repository.js";

export class InMemoryRepository<
  T extends BaseEntity,
> implements IRepository<T> {
  protected items = new Map<string, T>();

  create(item: T): T {
    if (item.id.trim().length === 0) {
      throw new Error("Entity ID must not be empty");
    }
    if (this.items.has(item.id)) {
      throw new Error(`Entity with ID ${item.id} already exists`);
    }
    for (const timestamp of [item.createdAt, item.updatedAt]) {
      if (
        !(timestamp instanceof Date) ||
        !Number.isFinite(timestamp.getTime())
      ) {
        throw new Error("Entity timestamps must be valid dates");
      }
    }
    const stored = structuredClone(item);
    this.items.set(stored.id, stored);
    return structuredClone(stored);
  }

  findById(id: string): T | null {
    const item = this.items.get(id);
    return item === undefined ? null : structuredClone(item);
  }

  findAll(): T[] {
    return structuredClone([...this.items.values()]);
  }

  deleteById(id: string): boolean {
    return this.items.delete(id);
  }

  update(id: string, patch: UpdateDto<T>): T | null {
    const existing = this.items.get(id);
    if (existing === undefined) {
      return null;
    }
    const updated: T = {
      ...existing,
      ...structuredClone(patch),
      id: existing.id,
      createdAt: new Date(existing.createdAt),
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return structuredClone(updated);
  }
}
