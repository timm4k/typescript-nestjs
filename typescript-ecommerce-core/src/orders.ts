import { randomUUID } from "node:crypto";
import { calculateCartTotal } from "./cart.js";
import { createProduct } from "./catalog.js";
import type { CartItem, DeliveryMethod, Order, OrderStatus } from "./models.js";
import { validateCustomerInput } from "./validation.js";

export function createOrder(
  customerEmail: unknown,
  items: readonly CartItem[],
  delivery: DeliveryMethod,
  discountPercent: number = 0,
): Order {
  if (items.length === 0) {
    throw new Error("Cannot check out an empty cart");
  }
  for (const item of items) {
    if (
      !item.product.inStock ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error(
        "Order items must be in stock with positive whole quantities",
      );
    }
  }
  calculateCartTotal(items, discountPercent);
  const createdAt = new Date();
  return {
    orderId: `order-${randomUUID()}`,
    customerEmail: validateCustomerInput(customerEmail),
    items: items.map((item) => ({
      product: createProduct(item.product),
      quantity: item.quantity,
    })),
    status: "pending",
    delivery,
    discountPercent,
    createdAt,
    updatedAt: createdAt,
  };
}

export function updateOrderStatus(order: Order, newStatus: OrderStatus): Order {
  const isFinalStatus =
    order.status === "cancelled" || order.status === "delivered";
  if (isFinalStatus && newStatus !== order.status) {
    throw new Error(`Cannot change an order with status ${order.status}`);
  }

  return {
    ...order,
    status: newStatus,
    updatedAt: new Date(),
  };
}
