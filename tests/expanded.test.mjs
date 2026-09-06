import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { series } from "../server/ledger.mjs";
import {
  searchAwards,
  exploreAwards,
  sourceFilters,
  awardSchema,
} from "../server/awards.mjs";
import { nonprofitSchema, subawardSchema } from "../server/organizations.mjs";
const read = (n) =>
  JSON.parse(fs.readFileSync(`public/data/${n}.json`, "utf8"));
test("OMB functional and agency classifications reconcile to net outlays, retaining negative offsets", () => {
  const d = read("fiscal-structure");
  for (const [key, snapshot] of Object.entries(d)) {
    assert.match(snapshot.source, /whitehouse.gov/);
    assert.ok(snapshot.retrievedAt);
    for (const row of snapshot.data) {
      assert.ok(row.year <= 2025);
      const delta = Math.abs(
        row.items.reduce((s, r) => s + r.amount, 0) - row.total,
      );
      assert.ok(
        delta <= row.items.length * 1e6,
        `${key} ${row.year} discrepancy ${delta}`,
      );
    }
  }
  assert.equal(d.functions.data.length, 86);
  assert.equal(d.agencies.data.length, 64);
  assert.equal(d.revenue.data.length, 92);
  assert.ok(d.functions.data.at(-1).items.some((r) => r.amount < 0));
  const total = read("normalized").historicalBudget.at(-1);
  assert.equal(d.functions.data.at(-1).total, total.spending);
  assert.equal(d.revenue.data.at(-1).total, total.revenue);
  assert.equal(
    series({ dataset: "revenue", from: 1971, to: 1971 }).data[0].items.length,
    5,
  );
});
test("expanded snapshots preserve award groups, source filters, geography scope and period measures", () => {
  for (const kind of ["contracts", "grants", "direct", "other", "loans"]) {
    const d = read(`explore-${kind}-awards`);
    assert.ok(d.data.length >= 90);
    assert.equal(
      new Set(d.data.map((r) => r.generated_internal_id)).size,
      d.data.length,
    );
    assert.ok(d.query.filters.award_type_codes.length);
    assert.ok(d.data.every((r) => r.awardKind === kind));
    if (kind === "loans")
      assert.ok(d.data.every((r) => r["Award Amount"] === r["Loan Value"]));
  }
  const countries = read("explore-all-countries");
  assert.equal(countries.query.scope, "place_of_performance");
  assert.equal(countries.query.filters.place_of_performance_scope, "foreign");
  assert.ok(countries.data.length > 150);
  assert.ok(read("explore-all-counts").data.grants > 500000);
});
test("combined award search federates disjoint source groups and preserves per-group pagination", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const body = JSON.parse(opts.body);
    calls.push(body);
    const code = body.filters.award_type_codes[0];
    return Response.json({
      results: [
        {
          "Award ID": code,
          "Recipient Name": "Example",
          "Award Amount": 10,
          generated_internal_id: code,
        },
      ],
      page_metadata: { hasNext: code === "A" },
    });
  });
  const r = await searchAwards({
    kind: "all",
    start: "2024-10-01",
    end: "2025-09-30",
    page: 2,
    recipient: "TEST-UNIQUE-RECIPIENT",
  });
  assert.equal(calls.length, 4);
  assert.equal(r.data.length, 4);
  assert.equal(r.hasNext, true);
  assert.ok(
    calls.every(
      (c) =>
        c.page === 2 &&
        c.filters.recipient_search_text[0] === "TEST-UNIQUE-RECIPIENT",
    ),
  );
  assert.match(r.paginationStrategy, /not a global/);
  assert.equal(r.sources.length, 4);
});
test("foreign geography queries use performance location and transaction obligations", async (t) => {
  let request;
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    request = { url, body: JSON.parse(opts.body) };
    return Response.json({
      results: [{ shape_code: "UKR", aggregated_amount: 5 }],
    });
  });
  const r = await exploreAwards({
    dimension: "countries",
    kind: "grants",
    start: "2023-10-01",
    end: "2024-09-30",
    scope: "foreign",
  });
  assert.equal(request.body.scope, "place_of_performance");
  assert.equal(request.body.geo_layer, "country");
  assert.equal(request.body.spending_level, "transactions");
  assert.equal(r.unit, "USD");
  assert.match(r.measure, /transaction obligations/);
});
test("invalid identifiers and contradictory geography filters are rejected", () => {
  assert.throws(() => nonprofitSchema.parse({ ein: "123/456789" }));
  assert.throws(() => subawardSchema.parse({ awardId: "../../secrets" }));
  assert.throws(() =>
    awardSchema.parse({
      start: "2024-01-01",
      end: "2025-01-01",
      state: "CA",
      scope: "foreign",
    }),
  );
  const a = awardSchema.parse({
    start: "2024-01-01",
    end: "2025-01-01",
    kind: "grants",
    program: "93.778",
  });
  assert.deepEqual(sourceFilters(a).program_numbers, ["93.778"]);
});
