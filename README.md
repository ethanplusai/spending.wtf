# spending.wtf — The public ledger

A complete redesign of the original spending.wtf application: an independent, source-linked platform for understanding federal spending, researching contracts, and exploring debt and purchasing power.

## Run locally

Requires Node.js 22.12+ (developed with Node 24), npm, and Python 3.9+ only when refreshing data.

```sh
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite serves the frontend; Express runs on dedicated loopback port 4317 and proxies requests to the public data providers. The checked-in, real source snapshots make the overview, history, geography, and initial contract results available without API credentials.

```sh
npm run build
npm start
```

Production serves the built frontend and API together at **http://localhost:4317**. Set `PORT` to change the production port and `HOST=0.0.0.0` to bind an external interface. The Docker image sets its own internal port to 3001. Deploy to a Node host or use the included Dockerfile. Vercel deployment and operating procedures are in [the release runbook](docs/release-runbook.md).

## Interactive redesign and agent access

The latest design uses a stark black/white palette with electric red, a playable 1971–2025 debt timeline, direct year scrubbing, and a spending/receipts experiment at second, minute, hour, and day scales. Time-scale figures are explicit annual-average illustrations, never live transaction claims.

A working MCP server supports both stdio (`npm run mcp`) and stateless Streamable HTTP (`POST /mcp`). The same source-backed query layer is available through `/api/v1/catalog`, `/api/v1/series/:dataset`, and `/api/v1/purchasing-power`; live awards use `/api/awards`; `/api/v1/explore` provides aggregate funding queries. Discovery and setup are published at `/llms.txt` and `/agents/README.md`. See [the agent guide](public/agents/README.md).

MCP has thirteen read-only tools and two resources. The production domain and exact Vercel deployment hosts are allowed automatically; set `MCP_ALLOWED_HOSTS` for other custom hosts. Tool output includes sources, units, observation periods, retrieval times, and limitations. This improves interoperability; it does not guarantee indexing or recognition.

## What is implemented

- **Money map:** revenue sources, all budget functions, agency outlays, historical comparisons, signed offsets, CSV, and an illustrative personal tax allocation. OMB history covers 92 / 86 / 64 years respectively.
- **Funding atlas:** paginated programs and recipients, 76 agency aggregates, 227 reported overseas performance locations, and nine years of obligations. Program, recipient and geographic selections open filtered award searches.
- **Beyond prime awards:** paginated reported subawards plus live nonprofit organization and IRS Form 990 financial searches through ProPublica. EIN/name matches to awards require verification.
- **Identity and motion:** wordmark and dollar favicon, finite landing and scroll reveals, and reduced-motion support.

- **National overview:** fiscal-year selection, spending/revenue/deficit metrics, latest reported gross debt, monthly and annual charts, nominal/real comparisons, exact-value tables, CSV export, and agency drill-through.
- **Federal award explorer:** contracts, grants, direct payments, other assistance, and loans; live keyword, date, awarding-agency, and performance-state queries; pagination; local result filtering; individual source records; CSV export; shareable search URLs; persistent browser-local research notebook.
- **Connection explorer:** agencies → recipients → awards, grouped by reported UEI or exact recipient name. Amounts are explicitly limited to the loaded records. Duplicate canonical award IDs are collapsed.
- **Award context:** live obligations, competition description, reported number of offers, pricing structure, PSC/NAICS, competition exceptions, subaward counts, and source links. A single-offer notice is a research lead, not a fraud finding.
- **Historical explorer:** gross debt from 1790; OMB spending/revenue from 1901; arbitrary year windows; a 1971 event marker; nominal, CPI-adjusted, GDP-relative, and per-person views; downloadable data; educational timeline.
- **The dollar:** latest monthly CPI and year-over-year inflation, plus an annual purchasing-power calculator with visible formulas and missing-data rules.
- **State/local exploration:** federal contract, grant, direct-payment, and combined non-loan obligation rankings for all 50 states and D.C., per-resident comparison, state drill-through, OMB national state/local own-source expenditure history from 1948, and a curated jurisdictional source directory.
- **Design:** responsive editorial layout, self-hosted DM Sans and Instrument Serif, custom responsive SVG charts, keyboard navigation, semantic tables, native modal focus management, reduced-motion support, and source methodology throughout.

## Source and measure integrity

The original public repository was inspected at `https://github.com/ethanplusai/spending.wtf`. Its USAspending and Treasury sources are retained; BLS, OMB historical workbooks, and World Bank denominator series expand coverage. See [research and design](docs/research-and-design.md) and [data architecture](docs/data-architecture.md).

Source snapshots were retrieved September 5, 2026. An observation date is not a retrieval date. Debt refreshes on page load, award, aggregate, and nonprofit searches run on request. Live provider responses use bounded five-minute caches. Other datasets are build-time snapshots.

Important accounting boundaries:

- **Outlays** are payments. **Obligations** are commitments. **Award amounts** are lifetime award totals. They are not interchangeable.
- A contract with activity inside a date range can have a much older start date. Its lifetime amount is not its spending in that range.
- National debt includes public and intragovernmental holdings. Its daily change is not necessarily the daily deficit.
- Treasury monthly data and OMB annual tables can have different revision vintages. The interface identifies the source rather than silently combining them.
- The BLS snapshot has no October 2025 CPI observation. Annual averages require 12 months, so the annual calculator ends in 2024; the latest monthly inflation indicator still includes valid 2026 observations.
- World Bank GDP and population are calendar-year measures matched to fiscal-year debt/outlays for context, not official fiscal-year ratios.
- OMB Table 14.2 uses state/local **own-source** expenditures on a NIPA basis, net of interest receipts. Federal grants are non-additive memorandum information. This is not a transaction-level ledger for every jurisdiction.

No invented fallback amounts, inferred unit quantities, simulated live debt ticks, hidden agency category splits, or fraud scores are used.

## Refresh the data

```sh
npm run data:refresh
npm run data:expand
npm test
npm run build
```

The Python pipeline retrieves Treasury, USAspending, BLS, World Bank, and the pinned FY 2027 OMB workbooks. It uses standard-library HTTP, JSON, ZIP, and XML handling; no Python packages or API keys are required. Treasury pagination is followed. Individual source writes are atomic; failed requests leave prior files intact and exit nonzero, preventing normalization/build commands chained with `&&` from continuing. A failed multi-source refresh can leave raw files from different retrievals; rerun successfully before rebuilding.

The original OMB workbooks and raw award response are retained for audit. Annual/monthly budget totals use the same publication vintage. Historical debt selects the later observation if a fiscal year appears twice (1843). Grouped early OMB periods and the separate 1976 transition quarter are not misrepresented as annual observations.

The OMB workbook paths are deliberately pinned to April 2026 / FY 2027. Review the next publication's schema, actual-versus-estimate cutoffs, and notes before updating these paths.

## Validation

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit/integration tests check monthly/annual reconciliation, CPI coverage, historical debt selection, debt components, award identity, context data, and API input validation. Browser tests cover date/filter queries, failed sources, exports, notebook persistence, award details, connections, historical transforms, state sources, and mobile navigation.

The recorded results and preview images are in [validation.md](docs/validation.md).

For visual and accessibility review, with `npm run dev` running:

```sh
node scripts/browser-check.mjs
node scripts/accessibility-check.mjs
```

These write screenshots and audit reports to a `spending-wtf` folder in the operating system temporary directory. Override `BASE_URL` or `ARTIFACT_DIR` to inspect a production build or choose an output location. Browser tests mock live query responses using real source records for reproducibility. A separate real USAspending query was exercised during development. Automated accessibility checks supplement, rather than replace, manual assistive-technology review.

## Project structure

```text
src/                    React views, responsive SVG chart, export utilities, styles
server/                 Express API, bounded cache, validation, static production server
public/data/            Raw source snapshots, original OMB workbooks, normalized display data
public/fonts/           Self-hosted open-source fonts and license files
scripts/                Ingestion, normalization, workbook reader, browser audits
tests/                 Data/API regression tests and Playwright browser tests
docs/                  Research, methodology, expansion architecture, and operating notes
```

## Scope and remaining expansion

The running release has a real frontend, backend, source ingestion, and local research persistence. It does not mirror the entire federal transaction universe, maintain a cross-jurisdiction entity warehouse, ingest every state/city checkbook, or provide shared user accounts and alerts. Those are explicit expansions described in [the aggregation plan](docs/aggregation-plan.md), with a proposed schema and acceptance criteria. No external account or paid service is required for the implemented release.

See [the expanded product and source record](docs/expansion-v4.md) for scope, accounting differences, the state-search fix, and further aggregation priorities.

### Tax exploration and production search rendering

Open `/taxes` for IRS income distributions (2001–2023), state income classes (2023), ZIP statistics (2022), and selected corporate disclosures. The visible flag mark has been removed; the site uses its wordmark and a dollar favicon.

`npm run data:taxes` refreshes the pinned IRS extracts. Agent access: `GET /api/v1/taxes` and MCP `query_taxes`; see [tax definitions](public/agents/taxes.md).

`npm run build` now creates both browser assets and a React server-rendering bundle. Serve production with `npm start`, not `vite preview`. Set `PUBLIC_SITE_URL` to the public origin (default `https://spending.wtf`). Canonical pages, sitemap, per-page metadata and structured data are rendered on the server; localhost and other hostnames are noindex. Run `npm run test:seo` after building. See [implementation, coverage and launch notes](docs/search-and-tax-v5.md).

### Corporate disclosures and employee scenarios

`/taxes/corporations` now compares 13 reviewed major issuers across 39 company-year observations, with source-specific caveats and exact fiscal period ends. The employee view models adjustable annual income-tax scenarios with reported US workforce or explicitly enabled geographic assumptions. It does not report actual employee tax payments or a complete national company ranking.

Use `rank_corporate_taxes` / `GET /api/v1/corporations` and `estimate_employee_taxes` / `POST /api/v1/workforce-estimate`. [Definitions and examples](public/agents/corporations.md). `npm run data:corporations` rebuilds the reviewed normalization; it is not a bulk SEC importer. [Implementation and validation](docs/corporate-expansion-v6.md).

## Release operations

Vercel uses `vercel.json` and `npm run build:vercel` to deploy CDN assets and a Node function for server-rendered pages, API and MCP. Weekly validated refreshes open a data pull request. Hourly and post-production-deployment smoke checks exercise the live site and upstream providers. See [the release runbook](docs/release-runbook.md) for limitations, settings and rollback.

Production launch checks and the remaining account settings are recorded in [production-launch.md](docs/production-launch.md).
