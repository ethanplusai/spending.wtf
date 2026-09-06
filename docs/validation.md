# Validation record — September 5, 2026

The following checks passed against the implemented local release:

| Check | Result |
|---|---|
| TypeScript and Vite production build | Passed; approximately 303 KB JavaScript / 94 KB gzip, 68 KB CSS / 14 KB gzip |
| ESLint | Passed |
| Data, API, and MCP tests | 20 passed |
| Playwright browser tests | 19 passed |
| Automated WCAG 2 A/AA and 2.1 AA checks | No violations detected across all eight main views, including budget, funding atlas, and nonprofit search |
| Browser runtime errors in visual checks | None |
| Mobile page overflow at 390 px | None in all eight main views |
| Real filtered USAspending search | Passed through Express in both development and production smoke checks |
| Production static routes and data files | Passed for all eight main views |
| Full source refresh and normalization | Passed for Treasury, USAspending, BLS, World Bank, and OMB; expanded source ingestion also passed |
| Dependency audit after compatible updates | Zero reported vulnerabilities |

MCP checks include SDK initialization, tool discovery, resource reads, structured responses, invalid inputs, real stdio transport, HTTP transport, and hostile-origin rejection. The agent interfaces share the same query layer and provenance as the HTTP API.

The browser suite additionally covers the interactive debt timeline, playback, year selection, and time-scale spending experiment. It covers annual/monthly chart changes, real-dollar modes, exact tables, CSV downloads and units, live search filters, automatic URL-based state queries, upstream failure handling, award details, connection grouping, saved notebook persistence, historical GDP context, CPI identity, complete-year coverage, pre/post-1971 spending, state ranking, state/local aggregates, directory filters, and mobile navigation.

Source records exposed three substantive regression cases: a repeated canonical award ID, multiple historical debt dates in 1843, and missing October 2025 CPI. Treasury monthly figures also required publication-vintage alignment to reconcile annual totals. All are handled explicitly and covered by tests.

Preview images: [desktop overview](previews/desktop.png), [mobile overview](previews/mobile.png), [historical explorer](previews/history.png). The automated accessibility result is preserved in [accessibility-audit.json](accessibility-audit.json).

These results do not constitute a manual screen-reader audit or a claim of perfect accessibility. The Docker configuration and GitHub Actions workflow are provided but were not executed in this local environment. No public deployment, repository push, or migration of the existing domain was performed.

## Expanded release checks

The state-search port collision was reproduced as a Next.js HTML response from another project. The corrected proxy was verified with live California contract and New York grant queries. Combined non-loan program search, program aggregates, nonprofit search/profile, and reported subawards returned successful JSON responses. Combined award searches use four category requests because the source rejects mixed groups.

The new browser tests cover the money map, negative agency outlays, program/country-to-award navigation, state grants, an HTML-response regression, reduced-motion behavior, below-the-fold scroll reveals, EIN/filing-period preservation, and prevention of pagination with unsubmitted filters. Accounting tests reconcile every new OMB year independently and confirm signed offsets and actual-year coverage.

A production server on isolated port 4318 passed eight route checks, bundled data loading, and a real filtered 50-record award query. The real stdio and HTTP MCP transport checks continue to pass with ten tools and seven historical datasets. Additional previews: [budget](previews/budget.png), [funding atlas](previews/atlas.png), [nonprofit entry](previews/organizations.png).
