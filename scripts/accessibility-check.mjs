import os from "node:os";
import path from "node:path";
import { mkdir } from "node:fs/promises";
const output =
  process.env.ARTIFACT_DIR || path.join(os.tmpdir(), "spending-wtf");
const base = process.env.BASE_URL || "http://localhost:5173";
await mkdir(output, { recursive: true });
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const results = [];
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
  await page.waitForTimeout(700);
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  results.push({
    view,
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
    })),
  });
}
await fs.writeFile(
  path.join(output, "ledger-accessibility.json"),
  JSON.stringify(results, null, 2),
);
console.log(
  results.map((r) => ({
    view: r.view,
    violations: r.violations.map((v) => ({ id: v.id, count: v.nodes.length })),
  })),
);
await browser.close();

console.log("Artifacts:", output);
