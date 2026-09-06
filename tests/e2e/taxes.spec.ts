import { test, expect } from "@playwright/test";
test("Income group, measure and year controls change the source observations", async ({
  page,
}) => {
  await page.goto("/taxes/income");
  await expect(
    page.getByRole("heading", {
      name: /One percent of returns.*38.4% of income tax/,
    }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Tax year", exact: true })
    .selectOption("2020");
  await expect(page.locator(".tax-focus .eyebrow")).toContainText("2020");
  await page.getByRole("button", { name: /Bottom 50%/ }).click();
  await expect(page.locator(".tax-focus h3")).toHaveText("Bottom 50%");
  await page
    .getByRole("button", { name: "Average tax rate", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Average tax rate", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".tax-exact summary").click();
  await expect(page.locator(".tax-exact tbody tr")).toHaveCount(23);
});
test("ZIP lookup retains leading zero and rejects unavailable years through the API", async ({
  page,
  request,
}) => {
  await page.goto("/taxes/geography");
  await page.getByLabel("Selected state").selectOption("NY");
  await page.getByLabel("Income class (AGI)").selectOption("10");
  await expect(page.locator(".tax-focus")).toContainText("NY / TAX YEAR 2023");
  await page.getByLabel("Five-digit ZIP code").fill("02139");
  await page.getByRole("button", { name: "Look up", exact: true }).click();
  await expect(page.locator(".tax-zip caption")).toContainText(
    "MA · ZIP 02139",
  );
  await expect(page.locator(".tax-zip tbody tr")).toHaveCount(6);
  const response = await request.get(
    "/api/v1/taxes?dataset=geography&zip=02139&year=2023",
  );
  expect(response.status()).toBe(400);
});
test("Company comparisons do not confuse missing federal cash with zero", async ({
  page,
}) => {
  await page.goto("/taxes/corporations");
  await expect(
    page.locator(".tax-company-metrics article").nth(0),
  ).toContainText("Not captured");
  await page.getByRole("button", { name: /Verizon/ }).click();
  await expect(
    page.locator(".tax-company-metrics article").nth(0),
  ).toContainText("$2.24B");
  await page.getByLabel("Company fiscal year").selectOption("2024");
  await expect(
    page.locator(".tax-company-metrics article").nth(0),
  ).toContainText("$4.75B");
  await page.getByRole("link", { name: "Income groups", exact: true }).click();
  await expect(page.locator(".tax-income")).toBeVisible();
  await expect(page).toHaveTitle(/Federal income tax share/);
  await page.goBack();
  await expect(page.locator(".tax-company-report")).toBeVisible();
});
test("Corporate budget receipts lead to the company disclosure explorer", async ({
  page,
}) => {
  await page.goto("/budget?tab=revenue");
  await page
    .locator(".budget-rank-list")
    .getByRole("button", { name: /Corporate income taxes/ })
    .click();
  const link = page.getByRole("link", {
    name: "Inspect company tax disclosures",
  });
  await expect(link).toHaveAttribute("href", "/taxes/corporations");
  await link.click();
  await expect(page.locator(".corporate-ledger")).toBeVisible();
});

test("Corporate rankings preserve fiscal years, missing measures and net refunds", async ({
  page,
}) => {
  await page.goto("/taxes/corporations");
  await expect(
    page.locator(".corporate-ledger > button").first(),
  ).toContainText("Alphabet");
  await expect(page.locator(".corporate-coverage")).toContainText("8 / 13");
  await page.getByLabel("Reported measure").selectOption("worldwideCash");
  await expect(
    page.locator(".corporate-ledger > button").first(),
  ).toContainText("Apple");
  await page.getByLabel("Reported measure").selectOption("federalCash");
  await page.getByRole("button", { name: /JPMorgan Chase/ }).click();
  await expect(page.locator(".tax-company-report")).toContainText(
    /net refund/i,
  );
  await page.getByLabel("Company fiscal year").selectOption("2026");
  await expect(
    page.locator(".corporate-ledger > button").first(),
  ).toContainText("NVIDIA");
  await expect(page.locator(".corporate-coverage")).toContainText("1 / 13");
});
test("Workforce estimates react to assumptions and exports preserve their modeled status", async ({
  page,
}) => {
  await page.goto("/taxes/corporations");
  await page
    .getByRole("button", { name: /The employee tax footprint/ })
    .click();
  await expect(page.locator(".corporate-coverage")).toContainText("5 / 13");
  await page.getByLabel("Annual taxable pay per worker (USD)").fill("100000");
  await expect(page.locator(".workforce-result > strong")).toContainText(
    "$1.88B",
  );
  await page
    .getByLabel("Include companies with an assumed U.S. workforce share")
    .check();
  await expect(page.locator(".corporate-coverage")).toContainText("13 / 13");
  await page.getByRole("button", { name: /Amazon/ }).click();
  await expect(page.locator(".workforce-result")).toContainText(
    "Assumed US share",
  );
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export this comparison" }).click();
  expect((await d).suggestedFilename()).toBe(
    "corporate-workforce-scenario.csv",
  );
});
