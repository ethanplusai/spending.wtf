# Release and operations

## Vercel

The existing GitHub repository is `ethanplusai/spending.wtf`; `main` deploys production. Release work starts on a branch based on the previous main commit. Before this rebuild the production revision was `f0db55b835d04acbac2e42f09d2ab32d174a83dc`, deployment `https://spending-m774g8d2x-ethans-projects-2b4b9f7d.vercel.app`.

`vercel.json` overrides the previous static-Vite framework configuration. `npm run build:vercel` compiles browser and SSR code, then moves the HTML shell under the private server directory. The CDN serves assets/data; remaining requests enter `api/index.mjs`, which exports Express without opening a listener. Server bundle/template URLs are denied before filesystem routing. Dynamic file inclusion packages the data, agent guides and SSR bundle. SSR dependencies are bundled by Vite (`ssr.noExternal`) because Vercel traces the API entrypoint and cannot discover imports inside a dynamically loaded, copied bundle. `npm run test:deployment` imports and renders a copied SSR artifact outside the workspace dependency tree to catch missing runtime packages. Node is pinned to 24.x.

`PUBLIC_SITE_URL` defaults to `https://spending.wtf`. Set it only to the intended canonical origin, including in preview. Preview hostnames receive noindex; production must preserve the original public Host header. MCP accepts the two production hostnames, local hosts, and exact deployment URLs supplied by Vercel. `MCP_ALLOWED_HOSTS` overrides the base list. Vercel does not require `HOST` or `PORT`; those are for standalone Node/Docker deployment.

## Release gate

1. `npm ci`, `npm run lint`, `npm test`, `npm run build:vercel`, `npm run test:seo`, and `npm run test:e2e` must pass.
2. Push the release branch and wait for GitHub checks and Vercel preview success.
3. `BASE_URL=https://PREVIEW CHECK_UPSTREAM=1 npm run test:smoke` checks all 12 public rendered pages, assets, data, tax APIs, sitemap, server-file protection, external MCP initialization/tool query, live Treasury and California contracts/grants. A protected preview can use a local `VERCEL_AUTOMATION_BYPASS_SECRET`; never commit it or log it.
4. Review preview on desktop and mobile, including navigation, chart controls and corporate/employee views. Browser regressions use mocked upstream responses, so they do not replace live smoke tests.
5. Merge/push the reviewed commit to main and verify Vercel success. Run the same smoke check against `https://spending.wtf` to verify indexable production HTML.

## Traffic and errors

App protection allows 120 API/MCP requests per client per minute, with at most 24 concurrent requests per function instance. Health checks are excluded. Clients receive JSON HTTP 429 plus Retry-After. Only Vercel-provided forwarded IPs are trusted in Vercel runtime; local servers use socket addresses. Buckets are bounded and expired entries are discarded. These limits are per instance, not global distributed quotas. Configure Vercel Firewall for `/api/*` and `/mcp` if a shared edge quota is required.

All app responses carry a request ID. HTTP 5xx responses generate structured error events in runtime logs with request ID, service, method, status and elapsed time. Search terms, request bodies and client IPs are not logged by this instrumentation. Provider details are not exposed by the final exception handler.

The `Monitor production` Actions workflow runs hourly and after successful production deployments. It fails on broken pages, source calls, tax APIs or MCP. GitHub Actions run status is the monitoring record; account notification preferences determine who receives failure notifications. No external alert destination or paid monitoring service is provisioned.

## Data refresh

`Refresh public data` runs weekly or manually, using a disposable checkout. All five ingestion commands, data tests, build and SEO tests must succeed before a pull request is opened on `automated/public-data-refresh`. No partial refresh is deployed. Review diffs and source dates before merging; the workflow deliberately does not auto-merge. GitHub must allow Actions to create pull requests. Bot-created PRs may require a maintainer push or manual CI dispatch because default GITHUB_TOKEN events do not trigger other workflows.

OMB publication URLs and IRS releases are pinned and require human review when new vintages are adopted. Corporate data is regenerated from reviewed disclosures; it is not an automated SEC ingestion service. Updating retrieval timestamps alone does not advance source observation dates. Failed refreshes preserve production because they never reach main. Review workflow failures in Actions.

## Rollback

Use Vercel Instant Rollback to the previous known-good production deployment first, preserving domain configuration. Record the resulting production target. Then revert the release commit in GitHub (ordinary revert, no force push) so main again matches the intended application. Do not rerun a bad production commit. The previous revision and deployment are recorded above. Verify the rolled-back site and disable new monitoring/refresh workflows if reverting removes their required endpoints.

## Search account setup

After deployment, verify ownership of `spending.wtf` in Google Search Console and Bing Webmaster Tools and submit `https://spending.wtf/sitemap.xml`. These require the owner's account or DNS access. Code generates canonical metadata and the sitemap; it cannot grant account ownership or guarantee indexing.

References: [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [function file inclusion](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions), [request headers](https://vercel.com/docs/headers/request-headers).
