# A fuller public ledger — September 5, 2026

## What changed

The original starter search showed the largest lifetime contracts. This is a biased introduction to government spending: large, long-running defense awards dominate. The new starter set interleaves ten records from each of four non-loan types; live searches query the source beyond those examples. Preserved snapshots contain 499 unique awards across five types. The aggregate award counts cover approximately ten million non-loan awards with FY 2025 activity, rather than claiming that many rows have been imported locally.

The budget explorer adds OMB Tables 2.1, 3.1, and 4.1: revenue sources (1934–2025), spending functions (1940–2025), and agency outlays (1962–2025). UI comparison controls span 1971–2025; the full preserved histories are available through the series API and MCP. The two budget classifications reconcile independently to net outlays. Negative categories and offsetting receipts are retained. OMB uses a later publication vintage than the overview's Treasury MTS: FY 2025 receipts round to $5.24T in this OMB edition and $5.23T in the MTS snapshot. Do not overwrite one series to conceal a vintage difference.

The funding atlas includes 76 awarding-agency aggregates, paginated assistance listings and recipients, 227 reported overseas performance locations, state aggregates across award types, and nine years of award obligations. Amounts are source-wide transaction aggregates, not sums of the visible award sample. Country coverage includes source-defined locations and unallocated categories; not every row is a sovereign country. Signed obligations can be negative.

## DataRepublican research and product direction

[DataRepublican's grant search](https://datarepublican.com/award_search/) combines grant recipients and amounts with identifier and keyword search. Its [charity graph](https://datarepublican.com/expose/) is a useful example of letting users follow an organization into a funding network. The transferable product idea is a continuous investigative path through records, with evidence attached to each connection.

Implemented paths:

- Budget purpose → historic outlays → relevant award search.
- Agency outlays → reported contracts and assistance (different accounting coverage).
- Assistance listing → matching awards → recipient → more awards.
- State or overseas location → reported awards at that performance location.
- Prime award → reported subawards, with nested amounts kept separate.
- Nonprofit search → EIN → IRS financial filing history through ProPublica → potential award-name matches requiring identity verification.
- Any supported historical dataset or live query → the same documented interface through MCP.

No political labels, personal associations, or name coincidences are represented as findings of fraud. Public-source descriptions remain untrusted data.

## Source interfaces

- [USAspending API](https://api.usaspending.gov/docs/endpoints): award search, spending by category, geography, time, award counts, award profiles, and subawards.
- [OMB Historical Tables](https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/): original FY 2027 workbooks retained locally.
- [ProPublica Nonprofit Explorer API](https://projects.propublica.org/nonprofits/api): IRS organization records and Form 990 extracted financials, with original filing links.

USAspending award search requires one award group per request. Combined search therefore makes four disjoint queries and returns up to 50 results per category per page. It is explicitly not a global amount ranking. A failed group fails the combined request rather than silently dropping an award category. Loan face values and subsidy costs remain separate from non-loan award amounts. Aggregate endpoints support multiple award types directly.

## Motion and identity

The new flag uses fifty terminal-like dots and seven drawn stripes, with the six spaces completing the thirteen-stripe motif. It is code-native SVG, also used as the favicon. Finite entrance animations reveal the title, debt value, and bars. IntersectionObserver reveals selected sections once. No scroll hijacking, automatic timeline playback, fake live count-up, or infinite decorative animation is used. Reduced-motion preferences disable the effects.

## State-search incident

Another local project bound 127.0.0.1:3001 while this API listened on a broader address. The proxy reached that project's Next.js HTML error response, which the client attempted to parse as JSON. This project now uses a dedicated loopback port (4317); Vite uses a strict frontend port. The HTTP client checks content type and returns an actionable error while preserving source-labeled prior results. Unknown API paths return JSON 404s rather than the SPA HTML document.

## Remaining aggregation work

The application queries public sources; it is not a complete replicated transaction warehouse. State and municipal own-source transactions remain a source directory and national aggregate history. IRS officer compensation and Schedule I inter-nonprofit grant edges are not yet normalized. Those are valuable next ingestion projects, but reliable links require source documents, EIN/UEI resolution, revision tracking, and duplicate control. See [the durable aggregation plan](aggregation-plan.md).

The highest-value next additions are a bulk transaction archive with versioned corrections, verified EIN–UEI links, Schedule I grant edges, recurring query/watchlist alerts, and consistent Census state/local finance series followed by specific jurisdiction transaction connectors. Those should build on the now-working query and evidence paths, rather than presenting an unverified network as complete.
