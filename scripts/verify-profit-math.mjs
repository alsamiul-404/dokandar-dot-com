/**
 * Mirrors /api/reports/profit aggregation (revenue, costOnBooks, grossProfit, unitsSold).
 * Run: npm run verify:profit
 */
import assert from "node:assert/strict";
import Decimal from "decimal.js";

function aggregate(lines) {
  let revenue = new Decimal(0);
  let costOnBooks = new Decimal(0);
  let unitsSold = 0;
  for (const l of lines) {
    const lineTotal = new Decimal(l.lineTotal);
    const buy = new Decimal(l.buyPrice);
    revenue = revenue.plus(lineTotal);
    costOnBooks = costOnBooks.plus(buy.mul(l.quantity));
    unitsSold += l.quantity;
  }
  const grossProfit = revenue.minus(costOnBooks);
  return { revenue, costOnBooks, grossProfit, unitsSold };
}

const lines = [
  { lineTotal: "100.00", buyPrice: "30", quantity: 2 },
  { lineTotal: "50.50", buyPrice: "10", quantity: 5 },
];

const { revenue, costOnBooks, grossProfit, unitsSold } = aggregate(lines);

assert.equal(revenue.toFixed(2), "150.50");
assert.equal(costOnBooks.toFixed(2), "110.00");
assert.equal(grossProfit.toFixed(2), "40.50");
assert.equal(unitsSold, 7);

console.log("verify:profit — aggregation OK");
