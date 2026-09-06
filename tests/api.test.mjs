import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../server/app.mjs";
let server, base;
before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = "http://127.0.0.1:" + server.address().port;
});
after(() => new Promise((resolve) => server.close(resolve)));
test("health endpoint reports an available API", async () => {
  const r = await fetch(base + "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});
test("invalid dates, pagination and filter payloads are rejected before querying a source", async () => {
  const valid = { start: "2024-10-01", end: "2025-09-30", page: 1 };
  for (const body of [
    { ...valid, start: "2025-02-30" },
    { ...valid, start: "2026-01-01" },
    { ...valid, page: 0 },
    { ...valid, page: 1.5 },
    { ...valid, state: "XX?" },
    { ...valid, query: ["bad"] },
    [],
  ]) {
    const r = await fetch(base + "/api/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.ok((await r.json()).error);
  }
});
test("invalid award identifiers cannot change the upstream path", async () => {
  const r = await fetch(
    base + "/api/awards/" + encodeURIComponent("invalid?query=1"),
  );
  assert.equal(r.status, 400);
});
