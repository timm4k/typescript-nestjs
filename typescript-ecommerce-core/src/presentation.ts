import { stdout } from "node:process";
import { calculateLineTotal } from "./catalog.js";
import { calculateCartTotal } from "./cart.js";
import type { CartItem, CatalogProduct, Order } from "./models.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "UAH",
});

const palette = {
  accent: "\u001b[38;5;183m",
  muted: "\u001b[38;5;245m",
  success: "\u001b[38;5;151m",
  warning: "\u001b[38;5;216m",
  strong: "\u001b[1m",
};
const reset = "\u001b[0m";
const useColor =
  Boolean(stdout.isTTY) &&
  process.env["NO_COLOR"] === undefined &&
  process.env["FORCE_COLOR"] !== "0" &&
  process.env["TERM"] !== "dumb";

function paint(text: string, tone: keyof typeof palette): string {
  return useColor ? `${palette[tone]}${text}${reset}` : text;
}

function contentWidth(): number {
  return Math.min(84, Math.max(32, (stdout.columns ?? 88) - 4));
}

function printWrapped(text: string, prefix = "  "): void {
  const width = Math.max(16, contentWidth() - prefix.length);
  let remaining = text;
  while (remaining.length > width) {
    const space = remaining.lastIndexOf(" ", width);
    const split = space > 0 ? space : width;
    console.log(prefix + remaining.slice(0, split));
    remaining = remaining.slice(split).trimStart();
  }
  console.log(prefix + remaining);
}

export function printSection(title: string, detail?: string): void {
  console.log();
  console.log(paint(`  ${title.toUpperCase()}`, "accent"));
  if (detail !== undefined) {
    printWrapped(detail);
  }
  console.log(paint(`  ${"─".repeat(contentWidth())}`, "muted"));
}

function printPriceRow(label: string, price: number): void {
  const amount = formatMoney(price);
  const gap = contentWidth() - label.length - amount.length;
  if (gap >= 2) {
    console.log(
      `  ${paint(label, "strong")}${" ".repeat(gap)}${paint(amount, "accent")}`,
    );
  } else {
    printWrapped(label);
    printWrapped(amount);
  }
}

export function formatMoney(amount: number): string {
  return currency.format(amount);
}

export function formatSize(product: CatalogProduct): string {
  return typeof product.size === "number" ? `EU ${product.size}` : `Size ${product.size}`;
}

export function printBanner(mode: "interactive" | "demo"): void {
  printSection("E-commerce core", "MULE DONKEY / CAT&SOFA / UNIQLO");
  console.log(
    paint(
      `  ${mode === "interactive" ? "Interactive store" : "Guided demonstration"} · Clothing & footwear`,
      "muted",
    ),
  );
  console.log(
    paint("  Real model names · Illustrative prices and stock", "muted"),
  );
}

export function printCatalog(products: readonly CatalogProduct[]): void {
  printSection(
    "Product catalog",
    `${products.length} pieces · Select by the number on the left`,
  );
  products.forEach((product, index) => {
    const number = String(index + 1).padStart(2, "0");
    printPriceRow(`${number}  ${product.title}`, product.price);
    printWrapped(
      `${product.brand} · ${formatSize(product)} · ${product.material} · ${product.color}`,
      "      ",
    );
    printWrapped(
      `ID: ${product.id} · ${product.inStock ? "In stock" : "Out of stock"} · ${product.tags.join(" / ")}`,
      "      ",
    );
    printWrapped(product.description ?? "Description: Not provided", "      ");
    if (index < products.length - 1) {
      console.log();
    }
  });
}

export function printCart(items: readonly CartItem[], discountPercent: number = 0): void {
  printSection("Shopping cart");
  if (items.length === 0) {
    console.log(paint("  Cart is empty", "muted"));
    console.log("  Choose Add item to start your selection");
    return;
  }
  items.forEach((item, index) => {
    printPriceRow(
      `${index + 1}) ${item.product.title} x ${item.quantity}`,
      calculateLineTotal(item.product.price, item.quantity, discountPercent),
    );
    printWrapped(
      `${item.product.brand} · ${formatSize(item.product)} · ${item.product.color}`,
      "     ",
    );
    printWrapped(`Unit price: ${formatMoney(item.product.price)}`, "     ");
  });
  console.log(paint(`  ${"─".repeat(contentWidth())}`, "muted"));
  if (discountPercent > 0) {
    const subtotal = calculateCartTotal(items);
    const total = calculateCartTotal(items, discountPercent);
    printWrapped(`Subtotal: ${formatMoney(subtotal)}`);
    printWrapped(`Discount: ${discountPercent}% | Saved: ${formatMoney(subtotal - total)}`);
  }
  console.log(
    paint(`  Order total: ${formatMoney(calculateCartTotal(items, discountPercent))}`, "strong"),
  );
  console.log(
    paint(
      `  ${items.length} lines · ${items.reduce((sum, item) => sum + item.quantity, 0)} units`,
      "muted",
    ),
  );
}

export function printOrder(order: Order): void {
  printSection("Order details");
  printWrapped(`Order ID: ${order.orderId}`);
  printWrapped(`Customer: ${order.customerEmail}`);
  printWrapped(`Delivery: ${order.delivery}`);
  console.log(paint(`  Status: ${order.status}`, "accent"));
  printWrapped(`Created at: ${order.createdAt.toISOString()}`);
  printWrapped(`Updated at: ${order.updatedAt.toISOString()}`);
  printCart(order.items, order.discountPercent ?? 0);
}

export function printMenu(): void {
  printSection("Menu");
  console.log("  [1] Catalog          [2] Add item");
  console.log("  [3] Cart             [4] Remove item");
  console.log("  [5] Checkout         [6] Change status");
  console.log("  [7] Current order    [0] Exit");
  console.log("  [8] Cart discount");
}

export function printSuccess(message: string): void {
  console.log(paint(`\n  + ${message}`, "success"));
}

export function printValidationError(message: string): void {
  console.log(paint(`\n  Validation error: ${message}`, "warning"));
  console.log(
    paint("  Nothing was changed · Choose an action to try again", "muted"),
  );
}

export function formatPrompt(prompt: string): string {
  return paint(`\n  › ${prompt}`, "accent");
}
