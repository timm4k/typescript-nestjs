import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addCartItem,
  calculateCartTotal,
  removeCartItem,
} from "../src/cart.js";
import { createOrder, updateOrderStatus } from "../src/orders.js";
import { createCatalog } from "../src/products.js";
import { parsePositiveInteger } from "../src/validation.js";
import { createProduct } from "../src/catalog.js";
import { formatSize } from "../src/presentation.js";

const [sweatshirt, sneakers] = createCatalog();
assert.ok(sweatshirt);
assert.ok(sneakers);

test("cart discounts apply to each line and validate even an empty cart", () => {
  const items = [
    { product: sweatshirt, quantity: 2 },
    { product: sneakers, quantity: 1 },
  ];
  assert.equal(calculateCartTotal(items, 10), 5400);
  assert.equal(calculateCartTotal(items, 100), 0);
  assert.equal(calculateCartTotal(items), 6000);
  for (const discount of [-1, 101, NaN, Infinity]) {
    assert.throws(() => calculateCartTotal([], discount), RangeError);
  }
});

test("checkout retains the discount through status updates", () => {
  const order = createOrder(
    "customer@example.com",
    [{ product: sweatshirt, quantity: 2 }],
    "post_office",
    10,
  );
  const updated = updateOrderStatus(order, "processing");
  assert.equal(updated.discountPercent, 10);
  assert.equal(calculateCartTotal(updated.items, updated.discountPercent), 3240);
  assert.equal(sweatshirt.price, 1800);
});

test("clothing uses letter sizes and footwear uses numeric EU sizes", () => {
  const products = createCatalog();
  const clothing = products.filter((product) => product.tags.includes("clothing"));
  const footwear = products.filter((product) => product.tags.includes("footwear"));
  assert.equal(clothing.length, 3);
  assert.equal(footwear.length, 2);
  assert.equal(clothing.every((product) => typeof product.size === "string"), true);
  assert.deepEqual(footwear.map((product) => product.size), [42, 43]);
  assert.equal(formatSize(sneakers), "EU 42");
  assert.equal(formatSize(sweatshirt), "Size M");
});

test("footwear rejects invalid numeric sizes", () => {
  for (const size of [0, -1, NaN, Infinity, -Infinity]) {
    assert.throws(() => createProduct({ ...sneakers, size }), RangeError);
  }
  assert.equal(createProduct({ ...sneakers, size: 42.5 }).size, 42.5);
});

test("the catalog contains five distinct branded clothing and footwear products", () => {
  const products = createCatalog();
  assert.equal(products.length, 5);
  assert.equal(new Set(products.map((product) => product.id)).size, 5);
  assert.deepEqual(
    new Set(products.map((product) => product.brand)),
    new Set(["Mule Donkey", "Cat&Sofa", "UNIQLO"]),
  );
  assert.equal(
    products.some((product) => product.tags.includes("clothing")),
    true,
  );
  assert.equal(
    products.some((product) => product.tags.includes("footwear")),
    true,
  );
  assert.equal(
    calculateCartTotal(products.map((product) => ({ product, quantity: 1 }))),
    10450,
  );
});

test("catalog calls return independent product objects and tag arrays", () => {
  const first = createCatalog();
  const second = createCatalog();
  const product = first[0];
  assert.ok(product);
  product.tags.push("changed");
  product.title = "Changed";
  assert.equal(second[0]?.title, "Sweat Oversized Pullover Hoodie");
  assert.equal(second[0]?.tags.includes("changed"), false);
});

test("parsePositiveInteger accepts trimmed positive whole numbers", () => {
  assert.equal(parsePositiveInteger(" 2 ", "Quantity"), 2);
  assert.equal(parsePositiveInteger("01", "Quantity"), 1);
});

test("parsePositiveInteger rejects empty, partial, fractional and unsafe input", () => {
  for (const input of [
    "",
    " ",
    "0",
    "-1",
    "1.5",
    "2abc",
    "1e2",
    "NaN",
    "Infinity",
    "9007199254740992",
  ]) {
    assert.throws(() => parsePositiveInteger(input, "Quantity"), RangeError);
  }
});

test("addCartItem adds and merges items without changing the previous cart", () => {
  const initial = [{ product: sweatshirt, quantity: 1 }];
  const merged = addCartItem(initial, sweatshirt, 2);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.quantity, 3);
  assert.equal(initial[0]?.quantity, 1);
  const added = addCartItem(merged, sneakers, 1);
  assert.equal(added.length, 2);
  assert.equal(calculateCartTotal(added), 7800);
});

test("addCartItem rejects unavailable products and invalid quantities", () => {
  assert.throws(() => addCartItem([], { ...sweatshirt, inStock: false }, 1));
  for (const quantity of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => addCartItem([], sweatshirt, quantity), RangeError);
  }
  assert.throws(
    () =>
      addCartItem(
        [{ product: sweatshirt, quantity: Number.MAX_SAFE_INTEGER }],
        sweatshirt,
        1,
      ),
    RangeError,
  );
});

test("removeCartItem removes the selected line without changing the source", () => {
  const source = [
    { product: sweatshirt, quantity: 2 },
    { product: sneakers, quantity: 1 },
  ];
  const result = removeCartItem(source, sweatshirt.id);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.product.id, sneakers.id);
  assert.equal(source.length, 2);
  assert.throws(() => removeCartItem(source, "missing"));
});

test("calculateCartTotal handles empty carts and decimal prices", () => {
  assert.equal(calculateCartTotal([]), 0);
  assert.equal(
    calculateCartTotal([
      { product: { ...sweatshirt, price: 0.1 }, quantity: 1 },
      { product: { ...sneakers, price: 0.2 }, quantity: 1 },
    ]),
    0.3,
  );
});

test("calculateCartTotal rejects combined monetary overflow", () => {
  const price = Number.MAX_SAFE_INTEGER / 200;
  assert.throws(
    () =>
      calculateCartTotal([
        { product: { ...sweatshirt, price }, quantity: 1 },
        { product: { ...sneakers, price }, quantity: 1 },
      ]),
    RangeError,
  );
});

test("createOrder validates email and snapshots cart data", () => {
  const product = createCatalog()[0];
  assert.ok(product);
  const source = [{ product, quantity: 2 }];
  const order = createOrder(" customer@example.com ", source, "store_pickup");
  assert.equal(order.customerEmail, "customer@example.com");
  assert.equal(order.status, "pending");
  assert.match(order.orderId, /^order-/);
  assert.notEqual(order.items, source);
  product.title = "Changed title";
  product.tags.push("changed");
  const sourceItem = source[0];
  assert.ok(sourceItem);
  sourceItem.quantity = 8;
  assert.equal(order.items[0]?.quantity, 2);
  assert.equal(order.items[0]?.product.title, "Sweat Oversized Pullover Hoodie");
  assert.equal(order.items[0]?.product.tags.includes("changed"), false);
});

test("createOrder rejects empty carts, invalid email and unavailable items", () => {
  assert.throws(() => createOrder("customer@example.com", [], "post_office"));
  assert.throws(
    () =>
      createOrder(42, [{ product: sweatshirt, quantity: 1 }], "post_office"),
    TypeError,
  );
  assert.throws(() =>
    createOrder(
      "invalid",
      [{ product: sweatshirt, quantity: 1 }],
      "post_office",
    ),
  );
  assert.throws(() =>
    createOrder(
      "customer@example.com",
      [{ product: sweatshirt, quantity: 0 }],
      "post_office",
    ),
  );
  assert.throws(() =>
    createOrder(
      "customer@example.com",
      [{ product: { ...sweatshirt, inStock: false }, quantity: 1 }],
      "post_office",
    ),
  );
});
