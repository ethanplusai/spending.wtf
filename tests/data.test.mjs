import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (name) =>
  JSON.parse(
    fs.readFileSync(
      new URL("../public/data/" + name + ".json", import.meta.url),
    ),
  );
const data = read("normalized");
test("every completed fiscal year reconciles to its 12 months at the same vintage", () => {
  for (const year of data.annual) {
    const months = data.monthly.filter((m) => m.year === year.year);
    assert.equal(months.length, 12, `FY ${year.year}`);
    for (const field of ["spending", "revenue"])
      assert.ok(
        Math.abs(months.reduce((sum, m) => sum + m[field], 0) - year[field]) <
          1,
        `FY ${year.year} ${field} reconciles within one dollar`,
      );
    assert.ok(months.every((m) => m.date <= year.date));
  }
});
test("annual CPI contains only complete source years and does not invent October 2025", () => {
  for (const year of data.cpi) {
    const raw = read("cpi").data.filter(
      (r) => +r.year === year.year && r.period !== "M13" && r.value !== "-",
    );
    assert.equal(raw.length, 12);
    assert.ok(
      Math.abs(raw.reduce((s, r) => s + Number(r.value), 0) / 12 - year.value) <
        1e-9,
    );
  }
  assert.equal(
    data.cpi.some((r) => r.year === 2025),
    false,
  );
  assert.equal(
    data.cpiMonthly.some((r) => r.date === "2025-10"),
    false,
  );
});
test("historical debt uses unique years and preserves the later 1843 observation", () => {
  assert.equal(
    new Set(data.debtHistory.map((r) => r.year)).size,
    data.debtHistory.length,
  );
  assert.equal(data.debtHistory.find((r) => r.year === 1843).debt, 32742922);
  assert.equal(data.debtHistory[0].year, 1790);
});
test("debt components reconcile to total at the reported date", () => {
  const r = read("debt").data[0];
  assert.ok(
    Math.abs(
      Number(r.debt_held_public_amt) +
        Number(r.intragov_hold_amt) -
        Number(r.tot_pub_debt_out_amt),
    ) < 0.1,
  );
  assert.match(r.record_date, /^\d{4}-\d{2}-\d{2}$/);
});
test("award snapshots preserve source IDs, finite amounts, and provenance", () => {
  const j = read("awards");
  assert.equal(j.data.length, 49);
  assert.match(j.source, /api.usaspending.gov/);
  assert.ok(j.retrievedAt);
  assert.equal(
    new Set(j.data.map((r) => r.generated_internal_id)).size,
    j.data.length,
  );
  for (const r of j.data) {
    assert.ok(r.generated_internal_id.startsWith("CONT_AWD_"));
    assert.ok(Number.isFinite(r["Award Amount"]));
    assert.ok(r["Recipient Name"]);
  }
});
test("context datasets contain real US observations and matching denominators", () => {
  for (const name of ["gdp", "population"]) {
    const j = read(name);
    assert.ok(j[1].length >= 60);
    assert.ok(j[1].every((r) => r.countryiso3code === "USA"));
    assert.ok(j[1].filter((r) => r.value !== null).every((r) => r.value > 0));
  }
});

test("OMB history preserves annual rows and dollar units across the 1971 break", () => {
  assert.equal(data.historicalBudget[0].year, 1901);
  assert.equal(data.historicalBudget.at(-1).year, 2025);
  assert.equal(data.historicalBudget.length, 125);
  assert.equal(
    data.historicalBudget.find((r) => r.year === 2025).spending,
    7011105e6,
  );
  assert.ok(
    data.historicalBudget.find((r) => r.year === 1970).spending <
      data.historicalBudget.find((r) => r.year === 1972).spending,
  );
  assert.equal(new Set(data.historicalBudget.map((r) => r.year)).size, 125);
});
test("state/local own-source aggregates avoid adding federal grants twice", () => {
  assert.equal(data.governmentExpenditures[0].year, 1948);
  assert.equal(data.governmentExpenditures.length, 78);
  for (const row of data.governmentExpenditures) {
    // Source values are rounded to one decimal billion dollars.
    assert.ok(
      Math.abs(row.total - row.federal - row.stateLocalOwnSource) <= 100000001,
    );
    assert.ok(row.grants >= 0);
  }
  assert.equal(
    data.governmentExpenditures.at(-1).stateLocalOwnSource,
    3246.1e9,
  );
});
