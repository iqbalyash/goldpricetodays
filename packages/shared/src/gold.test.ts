import assert from "node:assert/strict";
import test from "node:test";
import { calculateLocalGoldPrices, percentChange } from "./gold";

const charged = {
  spotUsdPerOunce: 31.1034768,
  usdToLocalRate: 100,
  taxPercent: 10,
  dutyPercent: 10,
  localPremiumPercent: 10,
};

test("applies duty, then tax, then city premium to each karat", () => {
  const quote = calculateLocalGoldPrices(charged);

  assert.equal(quote.price24kGram, 133.1);
  assert.equal(quote.price22kGram, 122.0083);
  assert.equal(quote.price21kGram, 116.4625);
  assert.equal(quote.price18kGram, 99.825);
  assert.equal(quote.price24kTola, 1552.4518);
  assert.equal(quote.price22kTola, 1423.0808);
  assert.equal(quote.price24kOunce, 4139.8728);
});

test("converts a troy ounce into grams and tolas when no charges apply", () => {
  const quote = calculateLocalGoldPrices({
    spotUsdPerOunce: 3110.34768,
    usdToLocalRate: 1,
    taxPercent: 0,
    dutyPercent: 0,
    localPremiumPercent: 0,
  });

  assert.equal(quote.price24kGram, 100);
  assert.equal(quote.price22kGram, 91.6667);
  assert.equal(quote.price21kGram, 87.5);
  assert.equal(quote.price18kGram, 75);
  assert.equal(quote.price24kTola, 1166.38);
  assert.equal(quote.price24kOunce, 3110.3477);
});

test("rejects a non-positive spot or exchange rate", () => {
  assert.throws(
    () =>
      calculateLocalGoldPrices({
        ...charged,
        spotUsdPerOunce: 0,
      }),
    RangeError,
  );
  assert.throws(
    () =>
      calculateLocalGoldPrices({
        ...charged,
        usdToLocalRate: -1,
      }),
    RangeError,
  );
});

test("measures the 24 hour move from the previous gram price", () => {
  assert.equal(percentChange(100, 110), 10);
  assert.equal(percentChange(200, 150), -25);
  assert.equal(percentChange(0, 150), 0);
});
