import type { BaseEntity } from "./base-entity.js";
import type { EntityStatus } from "./entity-status.js";

export type ClothingSize = "XS" | "S" | "M" | "L" | "XL";

export interface ClothingEntity extends BaseEntity {
  title: string;
  price: number;
  size: ClothingSize;
  material: string;
  color: string;
  status: EntityStatus;
}
