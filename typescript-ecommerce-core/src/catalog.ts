import type { CatalogProduct, FootwearProduct, Product } from "./models.js";
import { requireNonEmptyText, requireNonNegativeFinite } from "./validation.js";

const percentageBase = 100;
const minorUnitsPerCurrencyUnit = 100;

export function createProduct(productData: Product): Product;
export function createProduct(productData: FootwearProduct): FootwearProduct;
export function createProduct(productData: CatalogProduct): CatalogProduct;
export function createProduct(productData: CatalogProduct): CatalogProduct {
  requireNonNegativeFinite(productData.price, "Price");

  if (typeof productData.size === "number") {
    requireNonNegativeFinite(productData.size, "EU shoe size");
    if (productData.size === 0) {
      throw new RangeError("EU shoe size must be positive");
    }
  }

  if (typeof productData.id === "string") {
    requireNonEmptyText(productData.id, "Product ID");
  } else if (!Number.isFinite(productData.id)) {
    throw new Error("Product ID must be finite");
  }

  return {
    ...productData,
    title: requireNonEmptyText(productData.title, "Product title"),
    brand: requireNonEmptyText(productData.brand, "Brand"),
    material: requireNonEmptyText(productData.material, "Material"),
    color: requireNonEmptyText(productData.color, "Color"),
    tags: productData.tags.map((tag) => requireNonEmptyText(tag, "Tag")),
    ...(productData.description === undefined
      ? {}
      : { description: productData.description.trim() }),
  };
}

export function calculateLineTotal(
  price: number,
  quantity: number,
  discountPercent: number = 0,
): number {
  requireNonNegativeFinite(price, "Price");
  requireNonNegativeFinite(quantity, "Quantity");
  requireNonNegativeFinite(discountPercent, "Discount");

  if (!Number.isSafeInteger(quantity)) {
    throw new RangeError("Quantity must be a safe integer");
  }
  if (discountPercent > percentageBase) {
    throw new RangeError("Discount must not exceed 100 percent");
  }

  const total = price * quantity * (1 - discountPercent / percentageBase);
  const minorUnits = Math.round(
    (total + Number.EPSILON) * minorUnitsPerCurrencyUnit,
  );
  if (!Number.isSafeInteger(minorUnits)) {
    throw new RangeError("Line total exceeds the supported monetary range");
  }
  return minorUnits / minorUnitsPerCurrencyUnit;
}
