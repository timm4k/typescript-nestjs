import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const resolve = createRequire(import.meta.url).resolve;
const runner = resolve("tsx/cli");
const projectDirectory = fileURLToPath(new URL("../", import.meta.url));

test("interactive discounts survive validation and checkout and reset for a new cart", () => {
  const output = runSession([
    "8", "2", "1", "2", "8", "10", "8", "101", "8", " ",
    "5", "customer@example.com", "2", "6", "2", "2", "2", "1", "0",
  ]);
  assert.match(output, /Add items before applying a discount/);
  assert.match(output, /Discount: 10% \| Saved: UAH\s*360\.00/);
  assert.match(output, /Discount must not exceed 100 percent/);
  assert.match(output, /Discount must be a number between 0 and 100/);
  assert.match(output, /Order total: UAH\s*3,240\.00/);
  assert.match(output, /Status updated: pending -> processing/);
  const newCart = output.slice(output.lastIndexOf("Added: Fishnet Shoes"));
  assert.match(newCart, /Order total: UAH\s*2,400\.00/);
  assert.doesNotMatch(newCart, /Discount:/);
});

test("setting a zero discount restores the full cart price", () => {
  const output = runSession(["2", "1", "2", "8", "100", "8", "0", "3", "0"]);
  assert.match(output, /Order total: UAH\s*0\.00/);
  const restored = output.slice(output.lastIndexOf("Cart discount set to 0%"));
  assert.match(restored, /Order total: UAH\s*3,600\.00/);
  assert.doesNotMatch(restored, /Discount:/);
});

function runSession(
  lines: readonly string[],
  args: readonly string[] = [],
): string {
  const result = spawnSync(
    process.execPath,
    [runner, "src/index.ts", ...args],
    {
      cwd: projectDirectory,
      input: lines.join("\n") + "\n",
      encoding: "utf8",
      timeout: 10000,
    },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.doesNotMatch(result.stdout, /\u001b\[/);
  return result.stdout;
}

test("the fifth catalog product can be selected and checked out", () => {
  const output = runSession([
    "2",
    "5",
    "1",
    "5",
    "customer@example.com",
    "1",
    "0",
  ]);
  assert.match(output, /Sweat Wide Pants/);
  assert.match(output, /Mule Donkey/);
  assert.match(output, /Cat&Sofa/);
  assert.match(output, /Order total: UAH\s*2,100\.00/);
  assert.match(output, /Order created, cart cleared/);
});

test("interactive checkout and final status protection work end to end", () => {
  const output = runSession([
    "2",
    "1",
    "2",
    "2",
    "2",
    "1",
    "3",
    "5",
    " customer@example.com ",
    "2",
    "6",
    "2",
    "6",
    "3",
    "6",
    "4",
    "6",
    "2",
    "7",
    "0",
  ]);
  assert.match(output, /Order total: UAH\s*6,000\.00/);
  assert.match(output, /Customer: customer@example\.com/);
  assert.match(output, /Delivery: post_office/);
  assert.match(output, /Cat&Sofa · EU 42/);
  assert.doesNotMatch(output, /Size 42|Size 43/);
  assert.match(output, /pending -> processing/);
  assert.match(output, /processing -> shipped/);
  assert.match(output, /shipped -> delivered/);
  assert.match(output, /Cannot change an order with status delivered/);
  assert.match(output, /New order object: true/);
  assert.match(output, /Session closed/);
});

test("interactive validation rejects bad quantities and keeps the session usable", () => {
  const output = runSession(["invalid", "2", "1", "-2", "2", "9", "3", "0"]);
  assert.match(output, /Choose an action from 0 to 8/);
  assert.match(output, /Quantity must be a positive whole number/);
  assert.match(output, /Selection must be between 1 and 5/);
  assert.match(output, /Cart is empty/);
});

test("failed checkout keeps the cart and a later valid checkout succeeds", () => {
  const output = runSession([
    "5",
    "2",
    "1",
    "1",
    "5",
    "invalid",
    "5",
    "a@b",
    "3",
    "3",
    "0",
  ]);
  assert.match(output, /Cannot check out an empty cart/);
  assert.match(output, /Customer email must contain @/);
  assert.match(output, /Delivery: store_pickup/);
  assert.match(output, /Order created, cart cleared/);
  assert.match(output, /Cart is empty/);
});

test("removal, missing orders and unavailable actions are handled", () => {
  const output = runSession(["6", "7", "4", "2", "1", "1", "4", "1", "3", "0"]);
  assert.match(output, /Create an order before changing its status/);
  assert.match(output, /No order has been created/);
  assert.match(output, /Removed: Sweat Oversized Pullover Hoodie/);
  assert.match(output, /Cart is empty/);
});

test("end of input during a prompt closes the session without an error loop", () => {
  const output = runSession(["2"]);
  assert.match(output, /Product number:/);
  assert.match(output, /Session closed/);
  assert.doesNotMatch(output, /Validation error: Input closed/);
});

test("the separate demonstration remains available", () => {
  const output = runSession([], ["--demo"]);
  assert.match(output, /Order total: UAH\s*6,000\.00/);
  assert.match(output, /Original order unchanged: true/);
  assert.match(output, /Hoodie line with 10% discount: UAH\s*3,240\.00/);
  assert.doesNotMatch(output, /Choose an action:/);
});
