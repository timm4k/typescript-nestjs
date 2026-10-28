import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateLineTotal, createProduct } from "../src/catalog.js";
import type { Order, OrderStatus, Product } from "../src/models.js";
import { updateOrderStatus } from "../src/orders.js";
import { validateCustomerInput } from "../src/validation.js";

function productFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: "Sweat Oversized Pullover Hoodie",
    brand: "UNIQLO",
    price: 1800,
    tags: ["clothing"],
    inStock: true,
    size: "M",
    material: "Cotton",
    color: "Gray",
    ...overrides,
  };
}

function orderFixture(status: OrderStatus = "pending"): Order {
  const timestamp = new Date("2026-01-01T00:00:00Z");
  return {
    orderId: "order-test-001",
    customerEmail: "customer@example.com",
    items: [{ product: productFixture(), quantity: 2 }],
    status,
    delivery: "post_office",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

test("createProduct accepts both identifier types and optional descriptions", () => {
  const numeric = createProduct(productFixture());
  const text = createProduct(
    productFixture({ id: "shirt-02", description: "  Soft cotton  " }),
  );
  assert.equal(numeric.id, 1);
  assert.equal(numeric.description, undefined);
  assert.equal(text.id, "shirt-02");
  assert.equal(text.description, "Soft cotton");
});

test("createProduct returns a new object and copies the tags array", () => {
  const input = productFixture({ title: "  Sweatshirt  " });
  const created = createProduct(input);
  assert.notEqual(created, input);
  assert.notEqual(created.tags, input.tags);
  created.tags.push("new");
  assert.deepEqual(input.tags, ["clothing"]);
  assert.equal(input.title, "  Sweatshirt  ");
  assert.equal(created.title, "Sweatshirt");
});

for (const price of [-1, NaN, Infinity, -Infinity]) {
  test(`createProduct rejects price ${price}`, () => {
    assert.throws(() => createProduct(productFixture({ price })), RangeError);
  });
}

test("createProduct rejects blank identifiers and required text", () => {
  assert.throws(() => createProduct(productFixture({ id: " " })));
  assert.throws(() => createProduct(productFixture({ id: NaN })));
  for (const field of ["title", "brand", "material", "color"] as const) {
    assert.throws(() => createProduct(productFixture({ [field]: " " })));
  }
});

test("calculateLineTotal supports the default discount and rounds to two decimals", () => {
  assert.equal(calculateLineTotal(1800, 2), 3600);
  assert.equal(calculateLineTotal(1800, 2, 10), 3240);
  assert.equal(calculateLineTotal(19.99, 3, 10), 53.97);
  assert.equal(calculateLineTotal(0.1, 3), 0.3);
});

test("calculateLineTotal accepts zero price, zero quantity and full discount", () => {
  assert.equal(calculateLineTotal(0, 2), 0);
  assert.equal(calculateLineTotal(1800, 0), 0);
  assert.equal(calculateLineTotal(1800, 2, 100), 0);
});

for (const value of [-1, NaN, Infinity, -Infinity]) {
  test(`calculateLineTotal rejects invalid input ${value}`, () => {
    assert.throws(() => calculateLineTotal(value, 1), RangeError);
    assert.throws(() => calculateLineTotal(1, value), RangeError);
    assert.throws(() => calculateLineTotal(1, 1, value), RangeError);
  });
}

test("calculateLineTotal rejects fractional quantities, excessive discounts and overflow", () => {
  assert.throws(() => calculateLineTotal(10, 1.5), RangeError);
  assert.throws(() => calculateLineTotal(10, 1, 101), RangeError);
  assert.throws(() => calculateLineTotal(Number.MAX_VALUE, 2), RangeError);
});

test("validateCustomerInput trims strings without changing letter case", () => {
  assert.equal(
    validateCustomerInput("  Customer@example.com \n"),
    "Customer@example.com",
  );
});

test("validateCustomerInput rejects non-string values with TypeError", () => {
  const inputs: unknown[] = [
    null,
    undefined,
    42,
    true,
    {},
    [],
    { email: "a@b" },
  ];
  for (const input of inputs) {
    assert.throws(() => validateCustomerInput(input), TypeError);
  }
});

test("validateCustomerInput rejects empty strings and missing @", () => {
  for (const input of ["", "   ", "customer.example.com"]) {
    assert.throws(() => validateCustomerInput(input), Error);
  }
});

test("updateOrderStatus returns a new order without mutating the input", () => {
  const original = orderFixture();
  const before = structuredClone(original);
  const startedAt = Date.now();
  const updated = updateOrderStatus(original, "processing");
  assert.notEqual(updated, original);
  assert.deepEqual(original, before);
  assert.equal(updated.status, "processing");
  assert.equal(updated.createdAt.getTime(), original.createdAt.getTime());
  assert.notEqual(updated.updatedAt, original.updatedAt);
  assert.ok(updated.updatedAt.getTime() >= startedAt);
  assert.ok(updated.updatedAt.getTime() <= Date.now());
});

for (const finalStatus of ["cancelled", "delivered"] as const) {
  test(`updateOrderStatus prevents leaving ${finalStatus}`, () => {
    const original = orderFixture(finalStatus);
    const statuses: OrderStatus[] = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    for (const status of statuses) {
      if (status !== finalStatus) {
        assert.throws(() => updateOrderStatus(original, status), Error);
      }
    }
    assert.equal(original.status, finalStatus);
    assert.equal(updateOrderStatus(original, finalStatus).status, finalStatus);
  });
}

test("a cart supports all delivery methods from variant three", () => {
  const order = orderFixture();
  const deliveries: Order["delivery"][] = [
    "courier_fitting",
    "post_office",
    "store_pickup",
  ];
  for (const delivery of deliveries) {
    const candidate: Order = { ...order, delivery };
    assert.equal(candidate.delivery, delivery);
    const total = candidate.items.reduce(
      (sum, item) =>
        sum + calculateLineTotal(item.product.price, item.quantity),
      0,
    );
    assert.equal(total, 3600);
  }
});
