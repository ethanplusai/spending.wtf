import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const base = process.env.BASE_URL || "http://localhost:4318";
const health = await fetch(base + "/api/health");
assert.equal(health.status, 200);
const normalized = await fetch(base + "/data/normalized.json").then((r) =>
  r.json(),
);
assert.equal(normalized.historicalBudget.length, 125);
const search = await fetch(base + "/api/awards", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "office furniture",
    start: "2024-10-01",
    end: "2025-09-30",
    state: "CA",
    page: 1,
  }),
});
assert.equal(search.status, 200);
const records = await search.json();
assert.ok(records.data.length > 0);
assert.equal(
  new Set(records.data.map((r) => r.generated_internal_id)).size,
  records.data.length,
);
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const view of [
  "overview",
  "contracts",
  "history",
  "places",
  "methodology",
  "budget",
  "atlas",
  "organizations",
]) {
  await page.goto(base + "/?view=" + view);
  await page.locator("h1").waitFor();
  assert.equal(await page.locator("h1").count(), 1);
}
await browser.close();
assert.deepEqual(errors, []);
console.log(
  "Production smoke passed: static assets, eight routes, data, health, and real filtered USAspending query (" +
    records.data.length +
    " records).",
);
