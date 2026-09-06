# Research and design rationale

## Reference identified

The requested new U.S. “National Design Institute” appears to refer to the **National Design Studio**, established in 2025. Its [official site](https://ndstudio.gov/) and [mission](https://ndstudio.gov/about) emphasize clear, fast, dignified public services. Its portfolio includes [Genesis Mission](https://genesis.energy.gov/) and [Tech Force](https://techforce.gov/). These primary sources were reviewed September 5, 2026.

The rebuild translates that ambition into an independent civic research identity: a strong typographic hierarchy, generous space around essential information, warm paper and ink colors, restrained financial red and institutional green, and deliberately visible provenance. It does not reproduce government branding or imply government endorsement.

The main editorial premise is **“Your money. In the open.”** The abstract concentric ledger illustration gives a fiscal deficit scale and a spending-to-receipts ratio without implying that decorative geometry is a quantitative chart. Actual data graphics use axis labels, measures, dates, and tables.

## Original repository findings

The source repository already used React, TypeScript, Vite, USAspending, and Treasury. The current workspace initially contained only local project instructions and Git metadata. A read-only copy of the public repository was downloaded to inspect its implementation.

Problems found in the original service layer:

1. Agency fallback amounts and state amounts were hardcoded and returned after source failures.
2. Agency award-type splits were manufactured from fixed percentages of obligations.
3. Some Treasury Monthly Treasury Statement requests used the wrong API version and guessed field names.
4. Historical debt requests used a small page of recent observations, then grouped by year, truncating the claimed historical range.
5. Annual fallback figures could be substituted for unsupported fiscal years.
6. The README's original procurement method defaulted unknown quantities to one, creating unreliable unit-price comparisons.

The rebuild replaces these behaviors with actual source records, explicit missing states, source-specific normalization, and date-aware charts. It preserves source identity and distinguishes lifetime award values, period obligations, cash outlays, and debt stocks.

## Historical narrative

The [Federal Reserve's account of the 1971 suspension](https://www.federalreservehistory.org/essays/gold-convertibility-ends) establishes the event being marked. [The 1933 gold program](https://www.federalreservehistory.org/essays/roosevelts-gold-program) supplies the earlier domestic context. The narrative separates domestic redemption, international convertibility, and the later monetary regime.

The product lets users investigate their hypothesis that leaving gold contributed to fiscal expansion. It does not encode that hypothesis as a proven explanation. Debt and prices respond to multiple mechanisms, including fiscal choices, economic growth, war, recessions, demographics, productivity, and monetary policy. Adjusted and relative views make the magnitude more interpretable; none identifies the causal effect of a policy change by itself.

## Sources researched and used

| Source | Purpose | Implementation |
|---|---|---|
| [Treasury Fiscal Data](https://fiscaldata.treasury.gov/) | Debt, MTS receipts and outlays | Live debt and original JSON snapshots |
| [USAspending API reference](https://api.usaspending.gov/docs/endpoints) | Contract awards, award detail, geography | Live searches, detail drilldown, canonical-ID deduplication |
| [BLS CPI](https://www.bls.gov/cpi/) | Prices and purchasing power | CUUR0000SA0 observations; no missing-month interpolation |
| [OMB Historical Tables](https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/) | Long-run spending; state/local own-source expenditures | FY 2027 Tables 1.1 and 14.2, original workbooks retained |
| [World Bank GDP](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=US) | Contextual debt/spending-to-GDP | WDI annual observations, CC BY 4.0 |
| [World Bank population](https://data.worldbank.org/indicator/SP.POP.TOTL?locations=US) | Per-person context | Annual population; no forward-filled denominator |
| [Census government finances](https://www.census.gov/programs-surveys/gov-finances.html) | Future consistent jurisdiction comparisons | Source register and integration plan |
| [Open Book New York](https://www.osc.ny.gov/open-book-new-york) | State/local records | Source directory and first-state integration candidate |

FRED series pages helped verify definitions, units, and recent OMB values. Direct CSV downloads were blocked in this environment; no fabricated substitute or unavailable mirror was used. The official OMB workbooks ultimately supplied the long-run budget data directly.

## Interaction principles

- Begin with the national picture, then move to the source record.
- Keep units and period boundaries near the visualization.
- Provide hover inspection and exact-value table alternatives.
- Treat source errors as source errors, not zero activity.
- Save the source identifier, not just a screenshot of a number.
- Share search parameters in the URL.
- Export measure/source context alongside amounts.
- Use native browser behavior for forms, date validation, selects, and modal focus management.
- Self-host fonts and avoid third-party analytics.

## Second design iteration and agent access

The visual reset uses black, white, and electric red, large fiscal figures, and an interactive annual debt curve. Users can scrub or play 1971–2025 and translate annual spending, receipts, and the gap into second/minute/hour/day illustrations. Annual averages are explicitly labeled; playback does not imply live observations. The nominal 1971 multiplier links to inflation and GDP context rather than implying causation.

Agent access uses the [official MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/server): local stdio and stateless Streamable HTTP, five read-only tools, two resources, validated inputs, and structured results. The [llms.txt proposal](https://llmstxt.org/) informs a small discovery index pointing to Markdown documentation and the HTTP catalog. Discovery files do not guarantee indexing, citations, or agent adoption. Useful, attributable, reproducible queries are the primary product value.
