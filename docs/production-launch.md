# Production launch verification

The rebuild was merged through PR #1 to main (`bd9e504`) and deployed to https://spending.wtf on September 6, 2026 UTC (September 5 Eastern). Vercel and the main-branch Verify public ledger workflow succeeded. The earlier preview packaging failure was reproduced with Vercel's function builder and fixed by bundling SSR dependencies. A regression test now imports/renders the bundle outside workspace dependencies.

## Verified against the live domain

- All 12 public routes return server-rendered headings and structured data, with indexable production metadata. Assets, source JSON, sitemap and unknown-page behavior pass.
- External MCP initialization, all 13 tool definitions, an actual tax tool query and both documentation/catalog resources pass.
- Corporate ranking and ZIP APIs pass. The Microsoft employee scenario returns $1.40625 billion for explicitly supplied $75,000 taxable pay and 15% effective rate, labeled as modeled rather than observed.
- Live Treasury debt and California contract/grant queries return data from the production function.
- All 25 Playwright browser regressions pass against the live deployment. These verify deployed UI behavior using repeatable mocked upstream responses; the separate smoke test verifies real provider access.
- Eight main views pass the tested WCAG A/AA axe rules. Tax, budget and home pages pass desktop/mobile audit at 1440px and 390px with no page errors or horizontal overflow. Both corporate modes pass, including corporate rendering without JavaScript. Automated audits do not substitute for a full assistive-technology review.
- Production monitoring ran successfully after deployment: GitHub Actions run 34005495473. The schedule runs hourly at minute 17.
- The initial data refresh (run 34005472123) completed all ingestion, tests, build and SEO steps and saved a validated artifact. PR creation failed because the repository disallows GitHub Actions creating or approving PRs. The generated branch is `automated/public-data-refresh`; production snapshots were not changed by that failed workflow.

Local audit artifacts: `/private/tmp/spending-production-audit/` (temporary, not deployed).

## Repeating production checks

```sh
BASE_URL=https://spending.wtf CHECK_UPSTREAM=1 npm run test:smoke
BASE_URL=https://spending.wtf npm run test:e2e
BASE_URL=https://spending.wtf ARTIFACT_DIR=/tmp/spending-audit node scripts/accessibility-check.mjs
BASE_URL=https://spending.wtf ARTIFACT_DIR=/tmp/spending-tax-audit node scripts/tax-browser-check.mjs
BASE_URL=https://spending.wtf ARTIFACT_DIR=/tmp/spending-corporate-audit node scripts/corporate-browser-check.mjs
```

## Remaining owner/account configuration

- GitHub's “Allow GitHub Actions to create and approve pull requests” setting remains disabled. Automatic approval review rejected changing this persistent permission without explicit owner approval. Enabling it is needed for refresh PR creation; validated artifacts are still retained for review. No security setting was bypassed.
- Saved Vercel authentication returns HTTP 403 (`invalidToken`). Account-level distributed Firewall limits and notification settings cannot be configured until the owner signs in. The application has bounded per-instance rate/concurrency limits and structured HTTP 5xx logs; the public monitor is operational.
- Google Search Console and Bing Webmaster ownership verification and sitemap submission require owner account/DNS access. The public sitemap and production indexing directives are verified, but account submission and indexing are not claimed.

Rollback instructions and the previous production deployment are retained in [the release runbook](release-runbook.md).
