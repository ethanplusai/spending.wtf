import { test } from "node:test";
import assert from "node:assert/strict";
import { queryTaxes } from "../server/taxes.mjs";
import { createLedgerMcp } from "../server/mcp.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
test("Nonoverlapping income bands reconcile to the IRS totals in all 23 years", () => {
  const result = queryTaxes({ dataset: "income" });
  assert.equal(result.rows.length, 23);
  for (const row of result.rows) {
    for (const measure of ["returns", "agi", "tax"])
      assert.equal(
        row.bands.reduce((sum, b) => sum + b[measure], 0),
        row.groups.all[measure],
      );
    assert.ok(
      Math.abs(row.bands.reduce((sum, b) => sum + b.taxShare, 0) - 100) < 1e-8,
    );
  }
  const y = result.rows.at(-1);
  assert.equal(y.year, 2023);
  assert.equal(y.groups.top1.floor, 675602);
  assert.equal(y.groups.all.tax, 2144411000000);
  assert.ok(Math.abs(y.bands[3].taxShare - 38.398) < 0.001);
});
test("State units are converted from thousands and tax definitions remain separate", () => {
  const r = queryTaxes({ dataset: "geography", state: "US", band: 0 });
  assert.equal(r.year, 2023);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].incomeTax, 2115085827000);
  assert.equal(r.rows[0].totalLiability, 2259884586000);
  assert.equal(r.rows[0].returns, 159949000);
  assert.match(r.limitations, /A06500/);
});
test("ZIPs retain leading zeroes, preserve six classes and reject reserved buckets", () => {
  const r = queryTaxes({ dataset: "geography", zip: "02139" });
  assert.equal(r.year, 2022);
  assert.equal(r.rows.length, 6);
  assert.ok(r.rows.every((x) => x.zip === "02139" && x.state === "MA"));
  assert.match(r.limitations, /suppressed/);
  assert.throws(() => queryTaxes({ dataset: "geography", zip: "00000" }));
  assert.throws(() => queryTaxes({ dataset: "geography", zip: "99999" }));
  assert.throws(() => queryTaxes({ dataset: "geography", zip: "2139" }));
  assert.throws(() =>
    queryTaxes({ dataset: "geography", zip: "02139", year: 2023 }),
  );
  assert.throws(() =>
    queryTaxes({ dataset: "geography", zip: "02139", band: 0 }),
  );
  assert.throws(() => queryTaxes({ dataset: "geography", state: "ZZ" }));
  assert.throws(() => queryTaxes({ dataset: "income", state: "CA" }));
});
test("Corporate absence is null, cash and current expense are separate; pagination is bounded", () => {
  const r = queryTaxes({ dataset: "corporations", year: 2025 });
  const msft = r.rows.find((c) => c.ticker === "MSFT"),
    vz = r.rows.find((c) => c.ticker === "VZ");
  assert.equal(msft.years[0].federalCash, null);
  assert.equal(msft.years[0].worldwideCash, 28700000000);
  assert.equal(msft.years[0].federalCurrentExpense, 14086000000);
  assert.equal(vz.years[0].federalCash, 2236000000);
  const p = queryTaxes({ dataset: "geography", limit: 2 });
  assert.equal(p.rows.length, 2);
  assert.equal(p.hasMore, true);
  assert.throws(() => queryTaxes({ limit: 1000 }));
  assert.throws(() => queryTaxes({ dataset: "income", year: 2024 }));
});
test("Tax MCP tool returns structured data and definition limits", async () => {
  const server = createLedgerMcp(),
    client = new Client({ name: "tax-test", version: "1" }),
    [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(b);
  await client.connect(a);
  try {
    const r = await client.callTool({
      name: "query_taxes",
      arguments: { dataset: "income", year: 2023 },
    });
    assert.equal(r.structuredContent.rows[0].year, 2023);
    assert.match(r.structuredContent.limitations, /payroll/);
  } finally {
    await client.close();
    await server.close();
  }
});
