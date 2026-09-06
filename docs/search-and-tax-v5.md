# Search, answer access and tax research — September 2026

Historical implementation record. Current release details supersede the counts and coverage below: the race/data-gap view was removed, 12 public routes remain, and the corporate explorer covers 13 issuers. See [corporate expansion](corporate-expansion-v6.md) and [release operations](release-runbook.md).

The flag has been removed from the interface. The brand is the spending.wtf wordmark; a small dollar favicon identifies browser tabs.

## Search implementation

Production Express serves React-rendered HTML on the same URLs and with the same data used for client hydration. No crawler-only content. Thirteen indexable page routes cover the existing platform and five tax views; `/notebook` is private browser state and noindex. Legacy `?view=` URLs redirect permanently to clean paths, preserving filters. Unknown pages return a real 404. Internal navigation uses crawlable anchors.

Each page has a specific title, description, canonical, Open Graph/Twitter tags, and visible source-linked answer. JSON-LD describes WebSite, WebPage, breadcrumbs and relevant downloadable datasets. It does not claim government affiliation, guaranteed rich results or FAQ eligibility. Sitemap lists canonical pages only. Filtered pages and localhost/staging hostnames receive noindex; robots permits public research content. SSR bootstrap JSON escapes HTML script delimiters.

`PUBLIC_SITE_URL` sets the trusted canonical origin, default `https://spending.wtf`. Deploy at that hostname or configure it correctly. Production server rendering requires the full `npm run build`, which produces client assets and `dist/server/entry-server.js`. Vite dev/preview is not the production SEO server; use `npm start`. Server bundle paths are not publicly served.

AEO work uses the same crawlable, source-linked evidence: plain answers, explicit dates and measures, datasets, public HTTP and MCP, and Markdown instructions. llms.txt is an optional discovery aid, not a ranking mechanism. None of this guarantees indexing, rankings or citations.

After public deployment: verify the domain in Google Search Console and Bing Webmaster Tools, submit `/sitemap.xml`, inspect representative server-rendered pages, monitor canonical selection, crawl/index coverage and impressions, and measure answer citations where supported. These account actions and public deployment were not performed in this local implementation.

Primary guidance consulted:
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/structured-data/dataset
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a

## Tax expansion

The reproducible pinned IRS extractor normalizes 23 years of percentile data, 594 state/national/other-location income-class rows and 27,588 ZIP codes. Source URLs and SHA-256 checksums are in `/data/taxes.json`. Original source units are converted to USD. ZIP files are split by state; a small index prevents scanning every state on lookup. This is actual downloaded data, not generated mock records.

The explorer provides income-year selection, three distribution measures, four nonoverlapping selectable groups, a 23-year chart and exact observations; state ranking by measure and income class; a ZIP search; selected company/year disclosure comparisons; and a demographic research explanation. Corporate and individual revenue categories link to the new research views. API and MCP provide equivalent data access with validation and pagination.

Public company returns are confidential. Selected Microsoft and Verizon reports show why cash payments, federal payments and current expense must remain separate. This is deliberately labeled a two-company illustrative set, not a national corporate taxpayer ranking. A production expansion should ingest and review SEC XBRL/filing disclosures with accession IDs, periods, taxonomy/context validation and restatement handling. The SEC companyfacts request from this environment returned 403, so an unverified bulk importer was not presented as complete. Primary annual reports were reviewed directly for the included observations.

Race and ethnicity are not fields on federal returns. Treasury estimates demographic effects with statistical methods. The current release links that research and explains the gap; it does not fabricate an observed tax burden table. A broader all-tax incidence layer would need vetted research covering payroll, state/local and indirect burdens, explicit incidence assumptions and uncertainty.

Remaining coverage limits are data limits, not hidden empty UI: state observations are 2023; ZIP observations are 2022; selected corporate observations are 2023–2025; no complete all-tax burden by group, comprehensive corporate payment ledger, or observed race-by-tax ledger is available here. See `/agents/taxes.md` for field-level details.

## Validation completed

- Production build and ESLint pass.
- 25 data/API/MCP tests pass, including nonoverlapping income reconciliation for all 23 years, source-unit conversions, ZIP leading zeros and reserved buckets, unsupported vintages, company null semantics and the real MCP query.
- 4 production SEO checks pass: all 13 public routes have server-rendered headings and unique metadata, structured data parses, legacy redirects retain filters, unknown routes are 404, private/staging/filtered URLs are noindex, sitemap coverage is correct, and hostile query text cannot break bootstrap serialization.
- 19 existing browser tests and 4 new tax interaction tests pass. The new tests exercise income group/measure/year changes, state income classes, real ZIP lookup, company/year selection, tab back-navigation and the corporate receipts drill-down.
- Chromium production review covers five tax views, the budget and homepage at 1440px and 390px: no page errors/hydration failures, horizontal page overflow or violations under the tested WCAG A/AA rules. Screenshots: `docs/previews-v5/`. Automated checks do not replace a full manual accessibility audit.
