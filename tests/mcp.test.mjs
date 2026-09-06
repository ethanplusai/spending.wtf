import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { fileURLToPath } from "node:url";
import { createLedgerMcp } from "../server/mcp.mjs";
import app from "../server/app.mjs";
import { series, purchasing } from "../server/ledger.mjs";
test("series boundaries, pagination and unavailable CPI years preserve accounting semantics", () => {
  const a = series({ dataset: "budget", from: 1971, to: 2025, limit: 2 });
  assert.equal(a.data.length, 2);
  assert.equal(a.pagination.total, 55);
  assert.equal(a.pagination.nextOffset, 2);
  assert.equal(a.unit, "USD");
  assert.ok(a.source);
  assert.ok(a.retrievedAt);
  assert.throws(() => series({ dataset: "debt", from: 2025, to: 1971 }));
  assert.throws(() => series({ dataset: "debt", limit: 1000 }));
  assert.throws(() => purchasing({ amount: 100, from: 1971, to: 2025 }));
  assert.equal(purchasing({ amount: 100, from: 2024, to: 2024 }).result, 100);
});
test("MCP initializes, lists typed tools/resources and returns structured source-linked results", async () => {
  const server = createLedgerMcp(),
    client = new Client({ name: "test", version: "1" }),
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const tools = await client.listTools();
    assert.equal(tools.tools.length, 13);
    assert.ok(tools.tools.every((t) => t.annotations.readOnlyHint));
    const result = await client.callTool({
      name: "get_series",
      arguments: { dataset: "budget", from: 1971, to: 1972 },
    });
    assert.equal(result.structuredContent.data.length, 2);
    assert.equal(result.structuredContent.unit, "USD");
    const bad = await client.callTool({
      name: "calculate_purchasing_power",
      arguments: { amount: 100, from: 1971, to: 2025 },
    });
    assert.equal(bad.isError, true);
    const ranked = await client.callTool({
      name: "rank_corporate_taxes",
      arguments: { year: 2025, query: "JPM" },
    });
    assert.equal(ranked.structuredContent.rows[0].amount, -1099000000);
    const modeled = await client.callTool({
      name: "estimate_employee_taxes",
      arguments: { ticker: "MSFT", annualTaxablePay: 75000, effectiveRate: 15 },
    });
    assert.equal(
      modeled.structuredContent.rows[0].estimate.employeeIncomeTax,
      1406250000,
    );
    assert.match(modeled.structuredContent.classification, /scenario/);
    const resources = await client.listResources();
    assert.equal(resources.resources.length, 2);
    const r = await client.readResource({ uri: "ledger://methodology" });
    assert.match(r.contents[0].text, /Accounting/);
  } finally {
    await client.close();
    await server.close();
  }
});
test("real stdio MCP works without a running web server", async () => {
  const client = new Client({ name: "stdio-test", version: "1" }),
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("../server/mcp.mjs", import.meta.url))],
    });
  try {
    await client.connect(transport);
    const r = await client.callTool({
      name: "compare_years",
      arguments: { dataset: "debt", from: 1971, to: 2025 },
    });
    assert.equal(r.structuredContent.data.length, 2);
    assert.ok(
      r.structuredContent.data[1].debt > r.structuredContent.data[0].debt,
    );
  } finally {
    await client.close();
  }
});
test("Streamable HTTP MCP supports SDK clients and rejects unrelated browser origins", async () => {
  const http = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    }),
    base = "http://127.0.0.1:" + http.address().port,
    client = new Client({ name: "http-test", version: "1" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(base + "/mcp")),
    );
    const result = await client.callTool({
      name: "list_datasets",
      arguments: {},
    });
    assert.equal(result.structuredContent.datasets.length, 7);
    const blocked = await fetch(base + "/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://unrelated.example",
      },
      body: "{}",
    });
    assert.equal(blocked.status, 403);
    const catalog = await fetch(base + "/api/v1/catalog").then((r) => r.json());
    assert.equal(catalog.datasets.length, 7);
  } finally {
    await client.close();
    await new Promise((resolve) => http.close(resolve));
  }
});
