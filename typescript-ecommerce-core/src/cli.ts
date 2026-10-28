import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { addCartItem, calculateCartTotal, removeCartItem } from "./cart.js";
import type { CartItem, DeliveryMethod, Order, OrderStatus } from "./models.js";
import { createOrder, updateOrderStatus } from "./orders.js";
import {
  formatPrompt,
  printBanner,
  printCart,
  printCatalog,
  printMenu,
  printOrder,
  printSection,
  printSuccess,
  printValidationError,
} from "./presentation.js";
import { createCatalog } from "./products.js";
import { parsePositiveInteger, validateCustomerInput } from "./validation.js";

type Ask = (prompt: string) => Promise<string>;

async function selectIndex(
  ask: Ask,
  count: number,
  prompt: string,
): Promise<number> {
  const number = parsePositiveInteger(await ask(prompt), "Selection");
  if (number > count) {
    throw new RangeError(`Selection must be between 1 and ${count}`);
  }
  return number - 1;
}

const deliveryMethods: readonly DeliveryMethod[] = [
  "courier_fitting",
  "post_office",
  "store_pickup",
];
const orderStatuses: readonly OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export async function runInteractive(): Promise<void> {
  const terminal = createInterface({
    input: stdin,
    output: stdout,
    terminal: Boolean(stdin.isTTY && stdout.isTTY),
  });
  const lines = terminal[Symbol.asyncIterator]();
  let inputClosed = false;
  terminal.on("SIGINT", () => terminal.close());

  const ask: Ask = async (prompt) => {
    stdout.write(formatPrompt(prompt));
    const result = await lines.next();
    if (result.done) {
      inputClosed = true;
      throw new Error("Input closed");
    }
    return result.value;
  };

  const products = createCatalog();
  let cart: CartItem[] = [];
  let discountPercent = 0;
  let order: Order | undefined;

  printBanner("interactive");
  console.log("  Data is stored only for this session");
  printCatalog(products);

  try {
    while (true) {
      printMenu();
      try {
        const choice = (await ask("Choose an action: ")).trim();
        if (choice === "0") {
          break;
        }
        switch (choice) {
          case "1":
            printCatalog(products);
            break;
          case "2": {
            printCatalog(products);
            const index = await selectIndex(
              ask,
              products.length,
              "Product number: ",
            );
            const product = products[index];
            if (product === undefined) {
              throw new Error("Product was not found");
            }
            const quantity = parsePositiveInteger(
              await ask("Quantity: "),
              "Quantity",
            );
            cart = addCartItem(cart, product, quantity);
            printSuccess(`Added: ${product.title} x ${quantity}`);
            printCart(cart, discountPercent);
            break;
          }
          case "3":
            printCart(cart, discountPercent);
            break;
          case "4": {
            if (cart.length === 0) {
              throw new Error("Cart is empty");
            }
            printCart(cart, discountPercent);
            const index = await selectIndex(
              ask,
              cart.length,
              "Cart item number: ",
            );
            const item = cart[index];
            if (item === undefined) {
              throw new Error("Cart item was not found");
            }
            cart = removeCartItem(cart, item.product.id);
            if (cart.length === 0) {
              discountPercent = 0;
            }
            printSuccess(`Removed: ${item.product.title}`);
            printCart(cart, discountPercent);
            break;
          }
          case "5": {
            if (cart.length === 0) {
              throw new Error("Cannot check out an empty cart");
            }
            const email = validateCustomerInput(await ask("Customer email: "));
            printSection("Delivery options");
            deliveryMethods.forEach((delivery, index) =>
              console.log(`  [${index + 1}] ${delivery}`),
            );
            const index = await selectIndex(
              ask,
              deliveryMethods.length,
              "Delivery number: ",
            );
            const delivery = deliveryMethods[index];
            if (delivery === undefined) {
              throw new Error("Delivery method was not found");
            }
            order = createOrder(email, cart, delivery, discountPercent);
            cart = [];
            discountPercent = 0;
            printSuccess("Order created, cart cleared");
            printOrder(order);
            break;
          }
          case "6": {
            if (order === undefined) {
              throw new Error("Create an order before changing its status");
            }
            printSection("Order status");
            orderStatuses.forEach((status, index) =>
              console.log(`  [${index + 1}] ${status}`),
            );
            const index = await selectIndex(
              ask,
              orderStatuses.length,
              "Status number: ",
            );
            const status = orderStatuses[index];
            if (status === undefined) {
              throw new Error("Order status was not found");
            }
            const previous = order;
            order = updateOrderStatus(previous, status);
            printSuccess(
              `Status updated: ${previous.status} -> ${order.status}`,
            );
            console.log(`  Previous order unchanged: ${previous.status}`);
            console.log(`  New order object: ${previous !== order}`);
            printOrder(order);
            break;
          }
          case "7":
            if (order === undefined) {
              throw new Error("No order has been created");
            }
            printOrder(order);
            break;
          case "8": {
            if (cart.length === 0) {
              throw new Error("Add items before applying a discount");
            }
            const input = (await ask("Discount percent (0-100, 0 removes): ")).trim();
            if (!/^[0-9]+(?:\.[0-9]+)?$/.test(input)) {
              throw new RangeError("Discount must be a number between 0 and 100");
            }
            const selectedDiscount = Number(input);
            calculateCartTotal(cart, selectedDiscount);
            discountPercent = selectedDiscount;
            printSuccess(`Cart discount set to ${discountPercent}%`);
            printCart(cart, discountPercent);
            break;
          }
          default:
            throw new Error("Choose an action from 0 to 8");
        }
      } catch (error: unknown) {
        if (inputClosed) {
          break;
        }
        if (!(error instanceof Error)) {
          throw error;
        }
        printValidationError(error.message);
      }
    }
  } finally {
    terminal.close();
    console.log("\n  Session closed");
  }
}
