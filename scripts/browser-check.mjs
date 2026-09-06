import os from "node:os";
import path from "node:path";
import { mkdir } from "node:fs/promises";
const output =
  process.env.ARTIFACT_DIR || path.join(os.tmpdir(), "spending-wtf");
const base = process.env.BASE_URL || "http://localhost:5173";
await mkdir(output, { recursive: true });
import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base);
await page
  .getByRole("heading", { name: "America, this is the bill." })
  .waitFor();
await page.evaluate(() => document.fonts.ready);
await revealPage(page);
await page.screenshot({
  path: path.join(output, "ledger-desktop.png"),
  fullPage: true,
});
for (const view of [
  "contracts",
  "history",
  "places",
  "methodology",
  "budget",
  "atlas",
  "organizations",
]) {
  await page.goto(base + "/?view=" + view);
  await page.waitForTimeout(1000);
  await revealPage(page);
  await page.screenshot({
    path: path.join(output, `ledger-${view}.png`),
    fullPage: true,
  });
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base);
await page.waitForTimeout(500);
await revealPage(page);
await page.screenshot({
  path: path.join(output, "ledger-mobile.png"),
  fullPage: true,
});
console.log({
  errors,
  overflow: await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  ),
});
await browser.close();

console.log("Artifacts:", output);

async function revealPage(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1200);
}
