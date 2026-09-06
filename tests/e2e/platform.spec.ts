import { test, expect } from "@playwright/test";
import fs from "node:fs";
const snapshot = JSON.parse(fs.readFileSync("public/data/awards.json", "utf8"));
test("overview changes fiscal years, chart modes, table and download", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "America, this is the bill." }),
  ).toBeVisible();
  await page.getByLabel("Fiscal year", { exact: true }).selectOption("2020");
  await expect(page.locator(".metric").first()).toContainText("$6.55T");
  await page.getByRole("button", { name: "1Y", exact: true }).click();
  await page.getByRole("button", { name: "View data table" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(12);
  await page.getByRole("button", { name: "10Y", exact: true }).click();
  await page
    .getByRole("button", { name: "Inflation adjusted", exact: true })
    .click();
  await expect(page.locator(".unit-label")).toContainText("2024 DOLLARS");
  const d = page.waitForEvent("download");
  await page.getByLabel("Download chart data").click();
  expect((await d).suggestedFilename()).toBe("federal-budget.csv");
});
test("contracts search applies filters, connections, details and persistent notebook", async ({
  page,
}) => {
  await page.route("**/api/awards", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.state).toBe("CA");
    expect(body.query).toBe("office furniture");
    expect(body.start).toBe("2024-10-01");
    await route.fulfill({
      json: {
        data: snapshot.data.slice(0, 2),
        hasNext: false,
        retrievedAt: "2026-09-05T00:00:00Z",
        source: "USAspending.gov",
      },
    });
  });
  await page.route("**/api/awards/*", (route) =>
    route.fulfill({
      json: {
        date_signed: "2016-07-21",
        total_obligation: 123456,
        subaward_count: 2,
        latest_transaction_contract_data: {
          number_of_offers_received: "1",
          extent_competed_description: "FULL AND OPEN COMPETITION",
          type_of_contract_pricing_description: "COST PLUS FIXED FEE",
        },
      },
    }),
  );
  await page.goto("/?view=contracts");
  await expect(page.locator("tbody tr")).toHaveCount(40);
  await page.getByLabel("Search federal awards").fill("office furniture");
  await page.getByLabel("Performance state").selectOption("CA");
  await page.getByRole("button", { name: "Search the record" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(page.locator(".source-line")).toContainText("Live query");
  await page.getByRole("button", { name: "Connections", exact: true }).click();
  await expect(page.locator(".connection-row")).toHaveCount(2);
  await page.locator(".award-nodes button").first().click();
  await expect(page.locator("dialog")).toBeVisible();
  await expect(page.locator("dialog")).toContainText(
    "Research lead: one reported offer.",
  );
  await page.getByRole("button", { name: "Save award", exact: true }).click();
  await page.getByLabel("Close award detail").click();
  await page.getByLabel("Research notebook, 1 saved awards").click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("failed live queries retain labeled snapshot rather than zero or fabricated data", async ({
  page,
}) => {
  await page.route("**/api/awards", (route) =>
    route.fulfill({
      status: 502,
      json: { error: "USAspending is unavailable." },
    }),
  );
  await page.goto("/?view=contracts");
  await expect(page.locator("tbody tr")).toHaveCount(40);
  await page.getByRole("button", { name: "Search the record" }).click();
  await expect(page.getByRole("alert")).toContainText("unavailable");
  await expect(page.locator("tbody tr")).toHaveCount(40);
  await expect(page.locator(".source-line")).toContainText("Starter selection");
});
test("shared state search loads the selected geography automatically", async ({
  page,
}) => {
  await page.route("**/api/awards", (route) => {
    expect(route.request().postDataJSON().state).toBe("NY");
    return route.fulfill({
      json: {
        data: snapshot.data.slice(0, 1),
        hasNext: false,
        retrievedAt: "2026-09-05",
      },
    });
  });
  await page.goto("/?view=contracts&state=NY");
  await expect(page.locator(".source-line")).toContainText("Live query");
  await expect(page.getByLabel("Performance state")).toHaveValue("NY");
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("history transformations, CPI identity, and complete-year coverage", async ({
  page,
}) => {
  await page.goto("/?view=history");
  await expect(
    page.getByRole("heading", { name: "The long view." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Share of GDP", exact: true }).click();
  await expect(page.locator(".history-stats")).toContainText("%");
  await page.getByRole("button", { name: "View data", exact: true }).click();
  await expect(page.locator(".history-data tbody tr")).toHaveCount(66);
  await page.getByLabel("Purchasing power original year").selectOption("2024");
  await page.getByLabel("Purchasing power target year").selectOption("2024");
  await expect(page.locator(".calculator>strong")).toHaveText("$100.00");
  await expect(
    page
      .getByLabel("Purchasing power target year")
      .locator('option[value="2025"]'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "1971", exact: false }).click();
  await expect(
    page.getByLabel("History start year", { exact: true }),
  ).toHaveValue("1961");
});
test("state ranking changes, directory filters and notebook empty state", async ({
  page,
}) => {
  await page.goto("/?view=places");
  await expect(page.locator(".state-row")).toHaveCount(51);
  await page.getByLabel("Find a state").fill("New York");
  await page.locator(".state-row").click();
  await expect(page.locator(".state-detail h2")).toHaveText("New York");
  await page.getByRole("button", { name: "Local", exact: true }).click();
  await expect(page.locator(".portal-card")).toHaveCount(1);
  await page.getByLabel("Research notebook, 0 saved awards").click();
  await expect(
    page.getByRole("heading", { name: "Your next investigation starts here." }),
  ).toBeVisible();
});
test("mobile navigation and all views fit viewport without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
    await page.goto("/?view=" + view);
    await expect(page.locator(".loading")).toHaveCount(0);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByLabel("Toggle navigation").click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Debt & the dollar" })
    .click();
  await expect(
    page.getByRole("heading", { name: "The long view." }),
  ).toBeVisible();
});

test("long-run spending is available across 1971 with both receipts and outlays", async ({
  page,
}) => {
  await page.goto("/?view=history");
  await page.getByLabel("Historical series").selectOption("Spending & revenue");
  await page.getByLabel("History start year", { exact: true }).fill("1960");
  await page.getByLabel("History end year", { exact: true }).fill("1980");
  await page.getByRole("button", { name: "View data", exact: true }).click();
  await expect(page.locator(".history-data tbody tr")).toHaveCount(21);
  await expect(page.locator(".history-data th")).toHaveCount(3);
  await expect(page.locator(".series-selector")).toContainText("OMB Table 1.1");
});
test("national state/local expenditure data changes by year and exports source context", async ({
  page,
}) => {
  await page.goto("/?view=places");
  await page.getByLabel("Government expenditures year").selectOption("1971");
  await expect(page.locator(".local-metrics")).toContainText("$122.00B");
  await page.getByRole("button", { name: "View expenditure data" }).click();
  await expect(page.locator(".national-expenditure tbody tr")).toHaveCount(12);
  const downloaded = page.waitForEvent("download");
  await page.getByLabel("Download government expenditures").click();
  expect((await downloaded).suggestedFilename()).toBe(
    "government-expenditures.csv",
  );
});

test("monthly CSV remains nominal after switching away from real annual dollars", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Inflation adjusted", exact: true })
    .click();
  await page.getByRole("button", { name: "1Y", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByLabel("Download chart data").click();
  const downloaded = await pending;
  const file = await downloaded.path();
  const csv = fs.readFileSync(file!, "utf8");
  expect(csv).toContain('"USD"');
  expect(csv).not.toContain("purchasing power USD");
  await expect(page.locator(".chart-subhead")).toContainText("NOMINAL DOLLARS");
});

test("debt experience scrubs source years and changes the spending timescale", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Scrub national debt year").fill("1971");
  await expect(page.locator(".debt-readout")).toContainText("FISCAL YEAR 1971");
  await expect(page.locator(".debt-multiplier b")).toHaveText("1.0×");
  const minute = await page
    .locator(".spending-equation strong")
    .first()
    .textContent();
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.locator(".spending-experiment h2")).toContainText(
    "one day",
  );
  expect(
    await page.locator(".spending-equation strong").first().textContent(),
  ).not.toBe(minute);
  await page.getByLabel("Play debt timeline").click();
  await expect(page.getByLabel("Pause debt timeline")).toBeVisible();
  await page.getByLabel("Pause debt timeline").click();
  await expect(page.getByLabel("Play debt timeline")).toBeVisible();
});

test("money map reconciles revenue and outlays and exposes negative offsets", async ({
  page,
}) => {
  await page.goto("/?view=budget");
  await expect(page.locator(".flow-in>strong")).toHaveText("$5.24T");
  await expect(page.locator(".flow-out>strong")).toHaveText("$7.01T");
  await page.getByRole("button", { name: "Who pays", exact: false }).click();
  await expect(page.locator(".budget-inspector h2")).toHaveText(
    "Individual income taxes",
  );
  await page.getByLabel("Money map fiscal year").selectOption("1971");
  await expect(page.locator(".flow-in>strong")).toHaveText("$187.14B");
  await page
    .getByRole("button", { name: "Who spends it", exact: false })
    .click();
  await page.getByLabel("Find a budget category").fill("General Services");
  await page.locator(".budget-rank-list button").click();
  await expect(page.locator(".budget-inspector h2")).toContainText(
    "General Services",
  );
  await page.getByLabel("Money map fiscal year").selectOption("2025");
  await expect(page.locator(".budget-inspector>strong")).toHaveText(
    "−$379.00M",
  );
});
test("atlas program and country records open precise award queries", async ({
  page,
}) => {
  await page.route("**/api/awards", (route) =>
    route.fulfill({
      json: { data: [], hasNext: false, retrievedAt: "2026-09-05" },
    }),
  );
  await page.goto("/?view=atlas");
  await expect(page.locator(".atlas-list>button")).toHaveCount(100);
  await page.getByLabel("Filter atlas results").fill("Medicaid");
  await page.locator(".atlas-list>button").first().click();
  await page.getByRole("button", { name: "Open the award trail" }).click();
  await expect(page).toHaveURL(/program=93.778/);
  await page.goto("/?view=atlas&dimension=countries");
  await expect(page.locator(".overseas-heading")).toContainText(
    "not the same as foreign aid",
  );
  await page.getByLabel("Filter atlas results").fill("Germany");
  await page.getByRole("button", { name: "Open the award trail" }).click();
  await expect(page).toHaveURL(/country=DEU/);
});
test("HTML API failures produce a useful error without losing source-labeled records", async ({
  page,
}) => {
  await page.route("**/api/awards", (route) =>
    route.fulfill({
      status: 500,
      contentType: "text/html",
      body: "<!DOCTYPE html><h1>Other app error</h1>",
    }),
  );
  await page.goto("/?view=contracts");
  await expect(page.locator("tbody tr")).toHaveCount(40);
  await page.getByRole("button", { name: "Search the record" }).click();
  await expect(page.getByRole("alert")).toContainText("unexpected response");
  await expect(page.getByRole("alert")).not.toContainText("JSON");
  await expect(page.locator("tbody tr")).toHaveCount(40);
});
test("state grants open the selected state and correct award type", async ({
  page,
}) => {
  await page.route("**/api/awards", (route) => {
    const b = route.request().postDataJSON();
    expect(b.state).toBe("CA");
    expect(b.kind).toBe("grants");
    return route.fulfill({
      json: { data: [], hasNext: false, retrievedAt: "2026-09-05" },
    });
  });
  await page.goto("/?view=places");
  await page.getByRole("button", { name: "Grants", exact: true }).click();
  await expect(page.locator(".state-row")).toHaveCount(51);
  await page.getByRole("button", { name: "Explore grants in CA" }).click();
  await expect(page.locator(".source-line")).toContainText("Live query");
});
test("entrance motion respects reduced motion and scroll reveals leave controls usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".debt-bars button")).toHaveCount(55);
  expect(
    await page
      .locator(".debt-bars button")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page
    .getByRole("button", { name: /Where does every dollar go/ })
    .click();
  await expect(page.locator(".flow-out>strong")).toHaveText("$7.01T");
});

test("normal scrolling reveals the tax allocation and keeps the category ledger interactive", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?view=budget");
  await page.locator(".tax-receipt").scrollIntoViewIfNeeded();
  await expect(page.locator(".tax-receipt")).toHaveCSS("opacity", "1");
  await page.getByLabel("Illustrative tax payment").fill("20000");
  await expect(page.locator(".receipt-lines")).toContainText("Social Security");
  await expect(page.locator(".receipt-lines")).toContainText("−$");
});
test("nonprofit profiles preserve EIN and tax-period context before potential award matching", async ({
  page,
}) => {
  const organization = {
    ein: 12345678,
    strein: "01-2345678",
    name: "TEST UNIVERSITY",
    city: "Example",
    state: "NY",
  };
  await page.route("**/api/v1/nonprofits/search", (route) =>
    route.fulfill({
      json: {
        source: "https://projects.propublica.org/nonprofits/api",
        retrievedAt: "2026-09-05",
        data: { organizations: [organization], total_results: 1, num_pages: 1 },
      },
    }),
  );
  await page.route("**/api/v1/nonprofits/profile", (route) => {
    expect(route.request().postDataJSON().ein).toBe("012345678");
    return route.fulfill({
      json: {
        source: "https://projects.propublica.org/nonprofits/api",
        retrievedAt: "2026-09-05",
        data: {
          organization,
          filings_with_data: [
            {
              tax_prd: 202412,
              tax_prd_yr: 2024,
              totrevenue: 2000000,
              totfuncexpns: 1500000,
              totassetsend: 3000000,
              totliabend: 1000000,
              pdf_url: null,
            },
          ],
          filings_without_data: [],
        },
      },
    });
  });
  await page.goto("/?view=organizations");
  await page.getByRole("button", { name: "Search filings" }).click();
  await page.getByRole("button", { name: /TEST UNIVERSITY/ }).click();
  await expect(page.locator(".nonprofit-profile")).toContainText("$2.00M");
  await expect(page.locator(".nonprofit-profile")).toContainText(
    "not a verified EIN-to-UEI link",
  );
  await expect(page.getByLabel("Nonprofit tax period")).toHaveValue("202412");
});

test("editing atlas filters requires a new query before paginating old results", async ({
  page,
}) => {
  await page.goto("/?view=atlas");
  await expect(page.locator(".atlas-list>button")).toHaveCount(100);
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Atlas from").fill("2023-10-01");
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".source-line")).toContainText("2024-10-01");
});
