import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
const browser = await chromium.launch();
const out = "docs/previews-v5";
fs.mkdirSync(out, { recursive: true });
let failures = [];
for (const width of [1440, 390]) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => failures.push(e.message));
  for (const route of [
    "/taxes",
    "/taxes/income",
    "/taxes/geography",
    "/taxes/corporations",
    "/budget",
    "/",
  ]) {
    await page.goto("http://127.0.0.1:4319" + route);
    await page.waitForTimeout(700);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    if (overflow) failures.push("Overflow " + width + " " + route);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    if (axe.violations.length)
      failures.push({
        width,
        route,
        axe: axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      });
    await page.screenshot({
      path:
        out +
        "/" +
        (route.replaceAll("/", "-") || "home") +
        "-" +
        width +
        ".png",
      fullPage: true,
    });
    if (route === "/taxes/geography") {
      await page.getByLabel("Five-digit ZIP code").fill("02139");
      await page.getByRole("button", { name: "Look up", exact: true }).click();
      await page
        .getByRole("caption")
        .filter({ hasText: "ZIP 02139" })
        .waitFor();
    }
  }
  await context.close();
}
await browser.close();
console.log(JSON.stringify(failures, null, 2));
if (failures.length) process.exitCode = 1;
