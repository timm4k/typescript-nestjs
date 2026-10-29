import {
  countClothingByStatus,
  createClothing,
  summarizeClothing,
} from "./clothing.js";
import { InMemoryRepository } from "./repositories/in-memory-repository.js";
import type { ApiResponse } from "./types/api-response.js";
import type { ClothingEntity } from "./types/clothing-entity.js";
import type { CreateDto, EntitySummary, UpdateDto } from "./types/dto.js";
import { EntityStatus } from "./types/entity-status.js";

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function main(): void {
  const repository = new InMemoryRepository<ClothingEntity>();
  const catalog: CreateDto<ClothingEntity>[] = [
    {
      title: "Sweat Oversized Pullover Hoodie",
      price: 1800,
      size: "M",
      material: "Cotton blend",
      color: "Gray",
      status: EntityStatus.Active,
    },
    {
      title: "AIRism Cotton Oversized T-Shirt",
      price: 950,
      size: "S",
      material: "Cotton blend",
      color: "White",
      status: EntityStatus.Active,
    },
    {
      title: "Sweat Wide Pants",
      price: 2100,
      size: "XS",
      material: "Cotton blend",
      color: "Gray",
      status: EntityStatus.Draft,
    },
  ];

  section("CREATE | ClothingEntity from CreateDto");
  const created = catalog.map((dto) => repository.create(createClothing(dto)));
  console.table(
    created.map(({ id, title, price, size, material, color, status }) => ({
      id,
      title,
      price,
      size,
      material,
      color,
      status,
    })),
  );
  const first = created[0];
  const last = created[2];
  if (first === undefined || last === undefined) {
    throw new Error("The demonstration requires three clothing entities");
  }

  section("READ | findById and findAll");
  console.log(`Found by ID: ${repository.findById(first.id)?.title}`);
  console.log(`Repository count: ${repository.findAll().length}`);

  section("UPDATE | Partial DTO");
  const patch: UpdateDto<ClothingEntity> = { price: 1650, color: "Black" };
  printJson({ patch });
  const updated = repository.update(first.id, patch);
  if (updated === null) {
    throw new Error("The created entity could not be updated");
  }
  printJson({
    before: first,
    after: updated,
    sameId: updated.id === first.id,
    sameCreatedAt: updated.createdAt.getTime() === first.createdAt.getTime(),
    originalUnchanged: first.price === 1800 && first.color === "Gray",
    newObject: updated !== first,
  });
  repository.update(last.id, { status: EntityStatus.Archived });

  section("SUMMARY | Pick id, title and price");
  const summaries: EntitySummary<ClothingEntity>[] = repository
    .findAll()
    .map(summarizeClothing);
  console.table(summaries);

  section("ANALYTICS | Record<EntityStatus, number>");
  const all = repository.findAll();
  printJson(countClothingByStatus(all));

  section("API RESPONSE | ApiResponse<ClothingEntity>");
  const response: ApiResponse<ClothingEntity> = {
    success: true,
    data: updated,
    timestamp: new Date(),
    meta: { totalCount: all.length, storage: "in-memory" },
  };
  printJson(response);

  section("DELETE | deleteById");
  console.log(`Deleted existing entity: ${repository.deleteById(last.id)}`);
  console.log(`Find deleted entity: ${repository.findById(last.id)}`);
  console.log(`Delete again: ${repository.deleteById(last.id)}`);
  console.log(
    `Update missing entity: ${repository.update(last.id, { price: 100 })}`,
  );
  console.log(`Remaining entities: ${repository.findAll().length}`);
  console.log("\nData is stored only for this process");
}

try {
  main();
} catch (error: unknown) {
  console.error(
    error instanceof Error ? error.message : "Unexpected application error",
  );
  process.exitCode = 1;
}
