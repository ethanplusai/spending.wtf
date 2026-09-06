# Tax statistics — spending.wtf

Independent public-data research. Start at `/taxes`. Machine discovery: `/api/v1/catalog`. HTTP: `GET /api/v1/taxes`. MCP: `query_taxes` over `/mcp` or the stdio server. No API key is required.

## Questions and coverage

- Income: IRS Table 4.1, tax years 2001–2023, published March 2026. Aggregate sample estimates excluding dependent returns. Top groups are cumulative; `bands` are nonoverlapping and reconcile to the source totals.
- Geography: IRS Historic Table 2, tax year 2023, 594 national/state/other-location income-class records. `state=US&band=0` is the published national total. `band=0` means all returns; 1–10 are income classes.
- ZIP: IRS tax year 2022, 27,588 published ZIP codes, six positive-AGI classes. Five-digit strings preserve leading zeros. `00000` and `99999` are reserved aggregate/disclosure buckets and are rejected. ZIP data are not tax year 2023.
- Corporations: 13 reviewed major-company annual-report disclosures with 39 company-years across 2023–2026. Rankings are within captured observations, not all corporations. Each company has its source, CIK and fiscal year end. No confidential tax returns are exposed.
- Race: not collected on IRS returns. Treasury research uses estimates; this API does not infer race or return an observed tax-payment table by race.

## HTTP examples

```text
GET /api/v1/taxes?dataset=income&year=2023
GET /api/v1/taxes?dataset=geography&state=CA&band=10
GET /api/v1/taxes?dataset=geography&zip=02139
GET /api/v1/taxes?dataset=corporations&year=2025
GET /api/v1/taxes?dataset=geography&limit=100&offset=100
```

The dataset defaults to `income`. Optional filters: `year`, `state` (uppercase two-letter code), `zip` (five-digit string), `band`, `limit` (1–100, default 100), `offset` (nonnegative). Unknown parameters, unsupported years and incompatible filters return 400 JSON errors. A valid but unpublished ZIP returns an empty result, never an invented observation.

Responses include `rows`, `total`, `offset`, `hasMore`, `filters`, `source`, `retrievedAt`, `units`, `limitations`, and geographic `incomeBands`. Paginate until `hasMore=false`. `year` is explicit for geography; income observations carry their own year; companies have company fiscal years.

## MCP example

```json
{"name":"query_taxes","arguments":{"dataset":"geography","zip":"02139"}}
```

## Measures: do not conflate

All normalized monetary amounts are USD, not thousands or millions. Return counts are not people or households. Rates/shares are percentages, not fractions.

Income percentile `tax`: IRS total individual income tax under Table 4.1's definition. It includes net investment income tax, excludes refundable portions of credits and is not payroll or all federal taxes. `agi` is adjusted gross income, not wealth or total economic income. Average rate = tax / AGI, not a marginal bracket rate. Four derived bands: bottom 50%, 50th–90th, 90th–99th and top 1%. Do not add cumulative `groups.top1`, `groups.top10`, etc.

Geographic `incomeTax`: A06500, income tax after credits (Form 1040 line 22). `totalLiability`: A10300, total tax liability (Form 1040 line 24), including additional return taxes. These are not identical to Table 4.1 income tax, and neither measures all taxes. Filing addresses do not measure economic incidence. Geographic source amounts were multiplied by 1,000; percentile workbook amounts by 1,000,000.

ZIP cells are subject to rounding, suppression and combination. A source zero can reflect disclosure protection. Negative-AGI returns are excluded. Do not sum protected income-class cells and claim an unrestricted ZIP total. Do not infer individual identity or race from these aggregates.

Corporate `worldwideCash`: reported cash income taxes across jurisdictions (usually net of refunds; see issuer notes). `federalCash`: separately captured US federal cash income taxes. `federalCurrentExpense`: current federal accounting provision, not cash paid. Negative cash means a net refund. Null means not captured separately in the selected source snapshot, not zero. Do not allocate Treasury corporate receipts using this selected research set or infer nonpayment from missing disclosure.

Tax-year liabilities and Treasury fiscal-year cash receipts differ in timing, definitions and population. No all-tax incidence dataset is included in this release.

## Downloads and reproducibility

- `/data/taxes.json`: income, state observations, definitions and original IRS URLs/SHA-256 hashes.
- `/data/corporate-taxes.json`: reviewed company observations and source links.
- `/data/tax-zip-index.json`: ZIP to state lookup.
- `/data/tax-zip/MA.json`: published ZIP cells by state (replace MA with a listed state).
- Run `npm run data:taxes` to download and normalize the pinned IRS releases. `scripts/refresh-tax-data.py --source-dir DIR` can use verified local originals. The original 216 MB ZIP CSV stays outside the repository; its source URL and SHA-256 are recorded.

## Primary sources

- IRS Table 4.1: https://www.irs.gov/pub/irs-soi/23in41ts.xlsx
- IRS 2023 state CSV: https://www.irs.gov/pub/irs-soi/23in55cmcsv.csv
- IRS 2022 ZIP definitions: https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-statistics-2022-zip-code-data-soi
- Treasury demographic research: https://home.treasury.gov/news/featured-stories/disparities-in-the-benefits-of-tax-expenditures-by-race-and-ethnicity
- IRS disclosure rules: https://www.irs.gov/government-entities/federal-state-local-governments/disclosure-laws

Expanded rankings and employee scenarios: [corporate agent guide](/agents/corporations.md).
