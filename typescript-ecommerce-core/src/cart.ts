import { calculateLineTotal } from "./catalog.js";
import type { CartItem, CatalogProduct, EntityId } from "./models.js";

const minorUnitsPerCurrencyUnit = 100;

export function calculateCartTotal(
  items: readonly CartItem[],
  discountPercent: number = 0,
): number {
  calculateLineTotal(0, 0, discountPercent);
  const minorUnits = items.reduce((sum, item) => {
    const lineTotal = calculateLineTotal(item.product.price, item.quantity, discountPercent);
    const next = sum + Math.round(lineTotal * minorUnitsPerCurrencyUnit);
    if (!Number.isSafeInteger(next)) {
      throw new RangeError("Cart total exceeds the supported monetary range");
    }
    return next;
  }, 0);
  return minorUnits / minorUnitsPerCurrencyUnit;
}

export function addCartItem(
  items: readonly CartItem[],
  product: CatalogProduct,
  quantity: number,
): CartItem[] {
  if (!product.inStock) {
    throw new Error("Product is out of stock");
  }
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new RangeError("Quantity must be a positive safe integer");
  }

  const existing = items.find((item) => item.product.id === product.id);
  const updated =
    existing === undefined
      ? [...items, { product, quantity }]
      : items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
  calculateCartTotal(updated);
  return updated;
}

export function removeCartItem(
  items: readonly CartItem[],
  productId: EntityId,
): CartItem[] {
  if (!items.some((item) => item.product.id === productId)) {
    throw new Error("Product is not in the cart");
  }
  return items.filter((item) => item.product.id !== productId);
}
