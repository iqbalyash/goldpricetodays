import assert from "node:assert/strict";
import test from "node:test";
import { formatCurrency, formatSignedPercent } from "./currency";

test("formats USD and a signed percent", () => {
  assert.match(formatCurrency(1234.5, "USD", "$"), /1,234\.50/);
  assert.equal(formatSignedPercent(1.2), "+1.20%");
  assert.equal(formatSignedPercent(-0.5), "-0.50%");
  assert.equal(formatSignedPercent(0), "0.00%");
});

test("falls back to the currency symbol when the code is not a real currency", () => {
  assert.equal(formatCurrency(10, "GOLD", "Au"), "Au 10.00");
});
