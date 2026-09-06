# Corporate disclosures and employee tax scenarios

Independent research at `/taxes/corporations`. There are 13 selected major public companies and 39 company-year observations. This is a purposeful research set, not all US corporations, a representative sample, or a complete list of the largest companies. All figures are USD. Latest captured workforce dates range from January 2025 to January 2026.

## Reported company taxes

`GET /api/v1/corporations?year=2025&measure=federalCash`

MCP: `rank_corporate_taxes` with the same fields.

- `year`: company fiscal year (default 2025), not calendar year or Treasury fiscal year. Coverage currently 2023–2026 with issuer-specific gaps. Exact `periodEnd` accompanies observations. NVIDIA FY2026 ends January 25, 2026; Target FY2025 ends January 31, 2026; Walmart FY2025 ends January 31, 2025.
- `measure`: `federalCash`, `worldwideCash`, or `federalCurrentExpense`.
- `query`: optional name, ticker or CIK substring.
- `limit`: 1–100 (default 100); `offset`: nonnegative (default 0).

Responses contain `rows`, `rank`, `amount`, `periodEnd`, `source`, `notes`, `reviewedAt`, `measured`, `total`, `hasMore`, filters, selection and coverage. Rank is within matching captured observations. Null amounts are unranked, not zero. Refunds remain negative. Do not convert accounting expense into cash taxes.

Key source-specific caveats: Target FY2025 federal cash includes purchases of transferable tax credits, so not all payments were remitted to Treasury. Walmart's selected cash-flow table does not explicitly state refund netting. Berkshire and JPMorgan are consolidated groups; do not add subsidiary observations to their group totals. One-year cash timing does not establish a long-run effective tax burden.

The reviewed set: Apple, Microsoft, NVIDIA, Alphabet, Amazon, Meta, Berkshire Hathaway, JPMorgan Chase, Walmart, Costco, Target, Tesla and Verizon. Observations come from each company's primary annual report or SEC filing. `/data/corporate-taxes.json` contains source URLs, period ends, available accession identifiers, CIKs, notes and workforce definitions. `scripts/expand-corporate-data.py` reproduces the reviewed normalization from explicitly entered source observations; it is not a live SEC bulk downloader.

## Employee federal income-tax scenarios

`POST /api/v1/workforce-estimate`

MCP: `estimate_employee_taxes`

```json
{
  "ticker": "MSFT",
  "annualTaxablePay": 75000,
  "effectiveRate": 15,
  "assumedUSShare": 50,
  "includeAssumedUS": false
}
```

`annualTaxablePay` (USD, 0–1,000,000) and `effectiveRate` (percentage, 0–50) are required assumptions, not reported company wages or tax rates. Optional `ticker` restricts the set. `assumedUSShare` defaults to 50 percent and is ignored for companies with captured US workforce counts. `includeAssumedUS` defaults to false: without a captured US count, the estimate is null until explicitly enabled. `limit` and `offset` support pagination.

Formula: US workforce × assumed annual taxable pay × assumed effective federal income-tax rate / 100.

Reported US counts take precedence; Verizon and Berkshire US counts are explicitly derived from approximate reported global headcount and US shares. Workforce date and definitions accompany every result. Global employment is never silently treated as US employment. The model uses period-end employees or FTE as a full-year workforce proxy. Part-time work, seasonality and turnover make that assumption uncertain.

Response classification is **illustrative scenario**, not observed employee tax payments or a company-specific payroll estimate. Every result includes assumptions, workforce basis, source, date, payroll scenario, modeled employee tax and stress bounds. Low/high scenarios vary pay by ±25%, effective rate by ±5 percentage points, and unknown US shares by ±15 percentage points. Bounds are clipped to the allowed ranges. These are sensitivity scenarios, not confidence intervals.

Taxable pay excludes assumed pretax reductions. The effective rate represents the assumed aggregate federal income-tax burden after deductions and credits; it is not a statutory marginal bracket. No payroll, state, local, sales or corporate taxes are calculated. The model does not observe household filing status, dependents, other earnings, credits or withholding.

**Never add these estimates to reported corporate taxes and call the result company taxes paid.** Employees bear their own income taxes. These figures are not taxes uniquely caused by a company or estimates of revenue lost if the company did not exist.

For context, the default Microsoft scenario is 125,000 reported US full-time employees × $75,000 assumed taxable pay × 15% assumed effective rate = $1.40625 billion annually. Only headcount is reported; payroll and tax are assumptions. The same pay/rate defaults apply across companies for standardized comparison, not as empirical salary estimates.

## Broader coverage

SEC companyfacts and bulk financial-statement datasets can support a much larger automated research universe, followed by filing-context and tax-note review. Direct downloads returned 403 in the development environment; no complete bulk ingestion is claimed. The SEC cautions that flattened financial data are not a substitute for filings. Private-company returns and complete employer-level employee income-tax liabilities are not made public through these sources.

Primary bulk source: https://www.sec.gov/data-research/sec-markets-data/financial-statement-data-sets
