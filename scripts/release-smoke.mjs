import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const base = new URL(process.env.BASE_URL || "http://127.0.0.1:4317");
const headers = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    }
  : {};
async function get(path, options = {}) {
  const response = await fetch(new URL(path, base), {
    ...options,
    redirect: "manual",
    headers: { ...headers, ...options.headers },
    signal: AbortSignal.timeout(55000),
  });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response;
}
for (const path of [
  "/",
  "/budget",
  "/awards",
  "/funding",
  "/debt",
  "/states",
  "/sources",
  "/nonprofits",
  "/taxes",
  "/taxes/income",
  "/taxes/geography",
  "/taxes/corporations",
]) {
  const html = await (await get(path)).text();
  assert.ok(/<h1[ >]/.test(html), `${path}: missing server rendering`);
  assert.ok(
    /application\/ld\+json/.test(html),
    `${path}: missing structured data`,
  );
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1];
  assert.ok(robots, `${path}: missing indexing directive`);
  if (base.hostname === "spending.wtf")
    assert.ok(robots.startsWith("index,"), `${path}: production is noindex`);
  else if (base.hostname.endsWith(".vercel.app"))
    assert.ok(robots.startsWith("noindex,"), `${path}: preview is indexable`);
  if (path === "/") {
    for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g))
      await get(match[1]);
  }
}
assert.equal((await (await get("/api/health")).json()).status, "ok");
assert.ok(
  (await (await get("/data/normalized.json")).json()).historicalBudget.length >
    100,
);
await get("/api/v1/corporations?year=2025&measure=federalCash");
await get("/api/v1/taxes?dataset=geography&zip=02139&year=2022");
await get("/llms.txt");
const workforce = await (
  await get("/api/v1/workforce-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticker: "MSFT",
      annualTaxablePay: 75000,
      effectiveRate: 15,
    }),
  })
).json();
assert.equal(workforce.rows[0].estimate.employeeIncomeTax, 1406250000);
assert.match(workforce.classification, /not observed payments/);
const sitemap = await (await get("/sitemap.xml")).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, 12);
for (const path of [
  "/server/entry-server.js",
  "/server/page-template.html",
  "/not-a-real-page",
]) {
  assert.equal(
    (
      await fetch(new URL(path, base), {
        headers,
        signal: AbortSignal.timeout(20000),
      })
    ).status,
    404,
    path,
  );
}
const client = new Client({ name: "spending-release-check", version: "1.0.0" });
try {
  await client.connect(
    new StreamableHTTPClientTransport(new URL("/mcp", base), {
      requestInit: { headers },
    }),
  );
  assert.equal((await client.listTools()).tools.length, 13);
  const resources = (await client.listResources()).resources;
  assert.equal(resources.length, 2);
  for (const resource of resources) {
    const result = await client.readResource({ uri: resource.uri });
    assert.ok(
      result.contents.length > 0,
      `Empty MCP resource: ${resource.uri}`,
    );
  }
  const result = await client.callTool({
    name: "query_taxes",
    arguments: { dataset: "income", year: 2023 },
  });
  assert.ok(!result.isError, "MCP tax query failed");
} finally {
  await client.close();
}
if (process.env.CHECK_UPSTREAM === "1") {
  await get("/api/debt");
  for (const kind of ["contracts", "grants"]) {
    const result = await (
      await get("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          start: "2024-10-01",
          end: "2025-09-30",
          state: "CA",
          page: 1,
        }),
      })
    ).json();
    assert.ok(result.data?.length > 0, `No ${kind} records returned`);
  }
}
console.log(
  `Release smoke passed for ${base.origin}: 12 rendered routes, assets, data, API, sitemap, protected server files and 13-tool MCP${process.env.CHECK_UPSTREAM === "1" ? ", plus live Treasury and state award queries" : ""}.`,
);
