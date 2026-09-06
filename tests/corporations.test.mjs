import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  rankCorporateTaxes,
  estimateEmployeeTaxes,
} from "../server/corporations.mjs";
import { estimateWorkforce } from "../shared/workforce-model.mjs";
const data = JSON.parse(
  fs.readFileSync("public/data/corporate-taxes.json", "utf8"),
);
test("Reviewed issuer observations retain distinct periods, refunds and source context", () => {
  assert.equal(data.companies.length, 13);
  assert.equal(
    data.companies.reduce((n, c) => n + c.years.length, 0),
    39,
  );
  for (const c of data.companies) {
    assert.match(c.cik, /^\d{10}$/);
    assert.ok(c.source.startsWith("https://"));
    assert.ok(c.workforce.global > 0);
    assert.ok(c.workforce.us === null || c.workforce.us <= c.workforce.global);
    for (const y of c.years) {
      assert.match(y.periodEnd, /^\d{4}-\d{2}-\d{2}$/);
      for (const k of ["worldwideCash", "federalCash", "federalCurrentExpense"])
        assert.ok(y[k] === null || Number.isFinite(y[k]));
    }
  }
  const r = rankCorporateTaxes({ year: 2025 });
  assert.equal(r.rows[0].ticker, "GOOGL");
  assert.equal(r.rows[0].amount, 13658000000);
  assert.equal(r.rows.find((r) => r.ticker === "JPM").amount, -1099000000);
  assert.equal(r.rows.find((r) => r.ticker === "MSFT").rank, null);
  const nv = rankCorporateTaxes({ year: 2026, query: "NVDA" }).rows[0];
  assert.equal(nv.amount, 16755000000);
  assert.equal(nv.periodEnd, "2026-01-25");
  assert.equal(
    rankCorporateTaxes({ year: 2025, query: "NVDA" }).rows[0].amount,
    null,
  );
  assert.match(r.rows.find((r) => r.ticker === "TGT").notes, /transferable/);
});
test("Rank filters and pagination preserve scope; missing is not zero", () => {
  const r = rankCorporateTaxes({
    year: 2025,
    measure: "worldwideCash",
    limit: 2,
  });
  assert.equal(r.rows[0].ticker, "AAPL");
  assert.equal(r.rows[0].amount, 43369000000);
  assert.equal(r.hasMore, true);
  assert.equal(
    rankCorporateTaxes({
      year: 2025,
      measure: "federalCurrentExpense",
      query: "TSLA",
    }).rows[0].amount,
    0,
  );
  assert.throws(() => rankCorporateTaxes({ year: 2020 }));
  assert.throws(() => rankCorporateTaxes({ measure: "taxes" }));
  assert.throws(() => rankCorporateTaxes({ limit: 1000 }));
});
test("Employee model uses reported US count; unknown shares require opt-in", () => {
  const a = { annualTaxablePay: 75000, effectiveRate: 15 };
  const ms = estimateEmployeeTaxes({ ...a, ticker: "MSFT" }).rows[0];
  assert.equal(ms.estimate.estimatedUSWorkers, 125000);
  assert.equal(ms.estimate.employeeIncomeTax, 1406250000);
  assert.match(ms.estimate.classification, /Illustrative/);
  const missing = estimateEmployeeTaxes({ ...a, ticker: "AMZN" }).rows[0];
  assert.equal(missing.estimate, null);
  const modeled = estimateEmployeeTaxes({
    ...a,
    ticker: "AMZN",
    includeAssumedUS: true,
    assumedUSShare: 60,
  }).rows[0];
  assert.equal(modeled.estimate.estimatedUSWorkers, 945600);
  assert.match(modeled.estimate.usBasis, /Assumed/);
  assert.ok(modeled.estimate.low < modeled.estimate.employeeIncomeTax);
  assert.ok(modeled.estimate.high > modeled.estimate.employeeIncomeTax);
  assert.equal(
    estimateEmployeeTaxes({
      ...a,
      ticker: "MSFT",
      includeAssumedUS: true,
      assumedUSShare: 0,
    }).rows[0].estimate.estimatedUSWorkers,
    125000,
  );
  assert.equal(
    estimateEmployeeTaxes({ ...a, ticker: "MSFT", effectiveRate: 0 }).rows[0]
      .estimate.employeeIncomeTax,
    0,
  );
  assert.throws(() => estimateEmployeeTaxes({ ...a, annualTaxablePay: -1 }));
  assert.throws(() => estimateEmployeeTaxes({ ...a, effectiveRate: NaN }));
  assert.throws(() => estimateEmployeeTaxes({ ...a, ticker: "NOTHERE" }));
  assert.throws(() => estimateEmployeeTaxes({ ticker: "MSFT" }));
});
test("Browser and agent scenario calculations are identical", () => {
  const a = {
    annualTaxablePay: 123456,
    effectiveRate: 18,
    assumedUSShare: 43,
    includeAssumedUS: true,
  };
  for (const c of data.companies) {
    const api = estimateEmployeeTaxes({ ...a, ticker: c.ticker }).rows[0]
      .estimate;
    assert.deepEqual(api, estimateWorkforce(c, a));
  }
});
