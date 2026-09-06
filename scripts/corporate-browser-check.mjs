import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
const browser = await chromium.launch(),
  failures = [];
const out = process.env.ARTIFACT_DIR || "docs/previews-v6";
const base = process.env.BASE_URL || "http://127.0.0.1:4319";
fs.mkdirSync(out, { recursive: true });
for (const width of [1440, 390]) {
  const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    }),
    page = await context.newPage();
  page.on("pageerror", (e) => failures.push(e.message));
  await page.goto(base + "/taxes/corporations");
  await page.locator(".corporate-ledger>button").first().waitFor();
  for (const mode of ["reported", "workforce"]) {
    if (mode === "workforce")
      await page
        .getByRole("button", { name: /The employee tax footprint/ })
        .click();
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    if (axe.violations.length)
      failures.push({
        width,
        mode,
        violations: axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      failures.push("Overflow " + width + " " + mode);
    await page.screenshot({
      path: `${out}/corporations-${mode}-${width}.png`,
      fullPage: true,
    });
  }
  await context.close();
}
const noJS = await browser.newContext({ javaScriptEnabled: false });
const page = await noJS.newPage();
await page.goto(base + "/taxes/corporations");
if (!(await page.locator(".corporate-ledger").innerText()).includes("Alphabet"))
  failures.push("Missing no-JS corporate data");
await noJS.close();
await browser.close();
console.log(JSON.stringify(failures, null, 2));
if (failures.length) process.exitCode = 1;
