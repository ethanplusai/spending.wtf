import { trafficGuard, requestObservability } from "./operations.mjs";
import { rankCorporateTaxes, estimateEmployeeTaxes } from "./corporations.mjs";
import { queryTaxes } from "./taxes.mjs";
import { installPages } from "./pages.mjs";
import { catalog, series, purchasing, searchAwards } from "./ledger.mjs";
import { handleMcp } from "./mcp.mjs";
import { exploreAwards } from "./awards.mjs";
import {
  searchNonprofits,
  getNonprofit,
  getSubawards,
} from "./organizations.mjs";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
const app = express(),
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
app.disable("x-powered-by");
app.use(requestObservability);
const guard = trafficGuard();
app.use((req, res, next) =>
  req.path.startsWith("/api/") || req.path === "/mcp"
    ? guard(req, res, next)
    : next(),
);
app.use(express.json({ limit: "16kb" }));
const cache = new Map();
async function upstream(url, body) {
  const key = url + JSON.stringify(body),
    hit = cache.get(key);
  if (hit && Date.now() - hit.at < 300000) return hit.data;
  const r = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Source returned ${r.status}`);
  const data = await r.json();
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), data });
  return data;
}
app.get("/api/v1/corporations", (req, res) => {
  try {
    res.json(rankCorporateTaxes(req.query));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/v1/workforce-estimate", (req, res) => {
  try {
    res.json(estimateEmployeeTaxes(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/v1/taxes", (req, res) => {
  try {
    res.json(queryTaxes(req.query));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/health", (_, res) =>
  res.json({ status: "ok", service: "spending-wtf" }),
);
app.post("/api/awards", async (req, res) => {
  try {
    res.json(await searchAwards(req.body));
  } catch (error) {
    res.status(error.name === "ZodError" ? 400 : 502).json({
      error:
        error.name === "ZodError"
          ? "Invalid search filters or date range."
          : error.message,
    });
  }
});
app.post("/api/v1/explore", async (req, res) => {
  try {
    res.json(await exploreAwards(req.body));
  } catch (e) {
    res.status(e.name === "ZodError" ? 400 : 502).json({ error: e.message });
  }
});
for (const [endpoint, handler] of [
  ["nonprofits/search", searchNonprofits],
  ["nonprofits/profile", getNonprofit],
  ["subawards", getSubawards],
]) {
  app.post("/api/v1/" + endpoint, async (req, res) => {
    try {
      res.json(await handler(req.body));
    } catch (e) {
      res.status(e.name === "ZodError" ? 400 : 502).json({ error: e.message });
    }
  });
}
app.get("/api/v1/catalog", (_, res) => res.json(catalog()));
app.get("/api/v1/series/:dataset", (req, res) => {
  try {
    const args = { dataset: req.params.dataset };
    for (const key of ["from", "to", "limit", "offset"])
      if (req.query[key] !== undefined) args[key] = Number(req.query[key]);
    res.json(series(args));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/v1/purchasing-power", (req, res) => {
  try {
    res.json(purchasing(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/mcp", handleMcp);
app.all("/mcp", (_, res) =>
  res
    .status(405)
    .set("Allow", "POST")
    .json({ error: "Use MCP Streamable HTTP POST. No persistent SSE stream." }),
);
app.get("/api/awards/:id", async (req, res) => {
  try {
    if (!/^[\w.-]{1,200}$/.test(req.params.id))
      return res.status(400).json({ error: "Invalid award identifier" });
    res.json(
      await upstream(
        "https://api.usaspending.gov/api/v2/awards/" +
          encodeURIComponent(req.params.id) +
          "/",
      ),
    );
  } catch {
    res.status(502).json({
      error:
        "Award details are temporarily unavailable. Open the source record instead.",
    });
  }
});
app.get("/api/debt", async (_, res) => {
  try {
    const data = await upstream(
      "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1",
    );
    res.json({
      data: data.data,
      source: "U.S. Treasury",
      retrievedAt: new Date().toISOString(),
    });
  } catch {
    res.status(502).json({ error: "Treasury is temporarily unavailable." });
  }
});
app.use("/api", (_, res) =>
  res.status(404).json({ error: "Unknown data endpoint" }),
);
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError)
    return res.status(400).json({ error: "Invalid JSON request" });
  next(error);
});
installPages(app, root);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status === 413 ? 413 : 500;
  res
    .status(status)
    .json({
      error:
        status === 413
          ? "Request body too large"
          : "This request could not be completed. Please retry shortly.",
    });
});
export default app;
