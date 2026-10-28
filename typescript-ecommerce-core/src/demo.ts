import { calculateLineTotal } from "./catalog.js";
import type { CartItem } from "./models.js";
import { createOrder, updateOrderStatus } from "./orders.js";
import {
  formatMoney,
  printBanner,
  printCart,
  printCatalog,
  printOrder,
  printSection,
} from "./presentation.js";
import { createCatalog } from "./products.js";

export function runDemo(): void {
  const products = createCatalog();
  const hoodie = products[0];
  const sneakers = products[1];
  if (hoodie === undefined || sneakers === undefined) {
    throw new Error("The demo requires two catalog products");
  }

  printBanner("demo");
  printCatalog(products);
  const items: CartItem[] = [
    { product: hoodie, quantity: 2 },
    { product: sneakers, quantity: 1 },
  ];
  printCart(items);
  console.log(
    `  Hoodie line with 10% discount: ${formatMoney(calculateLineTotal(hoodie.price, 2, 10))}`,
  );

  const order = createOrder(
    "  customer@example.com  ",
    items,
    "courier_fitting",
  );
  printOrder(order);
  const processingOrder = updateOrderStatus(order, "processing");
  const shippedOrder = updateOrderStatus(processingOrder, "shipped");
  printSection("Order lifecycle");
  console.log(
    `  ${order.status} -> ${processingOrder.status} -> ${shippedOrder.status}`,
  );
  console.log(`  Updated at: ${shippedOrder.updatedAt.toISOString()}`);
  console.log(`  Original order unchanged: ${order.status === "pending"}`);
  console.log(`  New order object: ${order !== processingOrder}`);
}
