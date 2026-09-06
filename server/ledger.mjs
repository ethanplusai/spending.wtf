import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const dataDir = fs.existsSync(
  path.join(root, "public/data/normalized.json"),
)
  ? path.join(root, "public/data")
  : path.join(root, "dist/data");
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(dataDir, name + ".json"), "utf8"));
const definitions = {
  ...Object.fromEntries(
    ["revenue", "functions", "agencies"].map((key) => [
      key,
      {
        title: {
          revenue: "Federal receipts by source",
          functions: "Federal net outlays by function",
          agencies: "Federal net outlays by agency",
        }[key],
        key,
        structure: true,
        unit: "USD",
        frequency: "fiscal-year",
        source:
          "https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/",
        notes: [
          "OMB FY 2027 actuals only. Categories are nested within each year. Negative outlays and offsets retained. Do not add agency and function views; these are alternate classifications of the same budget.",
        ],
      },
    ]),
  ),
  debt: {
    title: "Gross federal debt",
    key: "debtHistory",
    unit: "USD",
    frequency: "fiscal-year-end",
    source:
      "https://fiscaldata.treasury.gov/datasets/historical-debt-outstanding/",
    snapshot: "debt-history",
    notes: [
      "Stock, not annual spending. Includes public and intragovernmental holdings. Later observation used for duplicate historical years.",
    ],
  },
  budget: {
    title: "Federal outlays and receipts",
    key: "historicalBudget",
    unit: "USD",
    frequency: "fiscal-year",
    source:
      "https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/",
    snapshot: "omb-historical-budget-metadata",
    notes: [
      "OMB FY 2027 Table 1.1. Actual annual rows only. Transition quarter 1976 excluded. Pre-1933 accounting concepts differ. Outlays minus receipts is the deficit.",
    ],
  },
  cpi: {
    title: "Consumer price index, complete-year averages",
    key: "cpi",
    unit: "index, 1982–84=100",
    frequency: "calendar-year",
    source: "https://www.bls.gov/cpi/",
    snapshot: "cpi",
    notes: [
      "CPI-U CUUR0000SA0, not seasonally adjusted. Requires twelve observed months; no missing-month interpolation. 2025 is excluded because October is unavailable.",
    ],
  },
  "state-local": {
    title: "National federal and state/local expenditures",
    key: "governmentExpenditures",
    unit: "USD",
    frequency: "annual, source fiscal-year conventions",
    source:
      "https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/",
    snapshot: "omb-government-expenditures-metadata",
    notes: [
      "OMB Table 14.2. State/local own sources on NIPA basis, net of interest receipts. Federal grants are non-additive memorandum amounts. Not jurisdiction-level transactions.",
    ],
  },
};
export const seriesSchema = z
  .object({
    dataset: z.enum([
      "debt",
      "budget",
      "cpi",
      "state-local",
      "revenue",
      "functions",
      "agencies",
    ]),
    from: z.number().int().min(1790).max(2100).optional(),
    to: z.number().int().min(1790).max(2100).optional(),
    limit: z.number().int().min(1).max(250).default(100),
    offset: z.number().int().min(0).max(10000).default(0),
  })
  .refine((x) => x.from === undefined || x.to === undefined || x.from <= x.to, {
    message: "from must not exceed to",
  });
const rowsFor = (d) =>
  d.structure
    ? read("fiscal-structure")[d.key].data
    : read("normalized")[d.key];
const provenanceFor = (d) =>
  d.structure ? read("fiscal-structure")[d.key] : read(d.snapshot);
export function catalog() {
  return {
    schemaVersion: "1.0",
    datasets: Object.entries(definitions).map(([id, d]) => ({
      id,
      title: d.title,
      unit: d.unit,
      frequency: d.frequency,
      source: provenanceFor(d).source || d.source,
      retrievedAt: provenanceFor(d).retrievedAt,
      coverage: {
        from: rowsFor(d)[0].year,
        to: rowsFor(d).at(-1).year,
      },
      limitations: d.notes,
      endpoint: `/api/v1/series/${id}`,
    })),
    liveQueries: [
      {
        endpoint: "/api/awards",
        method: "POST",
        mcp: "search_awards",
        coverage:
          "Contracts, grants, direct payments, other assistance, and loans",
        pagination:
          "50 per category; all combines four category pages, not a global ranking",
      },
      {
        endpoint: "/api/v1/explore",
        method: "POST",
        mcp: "explore_funding",
        coverage:
          "Agency, program, recipient, state, country, time and count aggregates",
        measure: "Period transaction obligations; award activity counts",
      },
      {
        endpoint: "/api/v1/subawards",
        method: "POST",
        mcp: "get_subawards",
        coverage: "Reported downstream prime-award recipients",
        pagination: "25 per page",
      },
      {
        endpoint: "/api/v1/nonprofits/search",
        method: "POST",
        mcp: "search_nonprofits",
        coverage: "IRS exempt organizations via ProPublica",
        pagination: "Zero-indexed source pages",
      },
      {
        endpoint: "/api/v1/nonprofits/profile",
        method: "POST",
        mcp: "get_nonprofit",
        coverage:
          "Available IRS financial filing observations and documents for a nine-digit EIN",
      },
    ],
    corporateResearch: {
      rankEndpoint: "/api/v1/corporations",
      rankMcp: "rank_corporate_taxes",
      scenarioEndpoint: "/api/v1/workforce-estimate",
      scenarioMethod: "POST",
      scenarioMcp: "estimate_employee_taxes",
      documentation: "/agents/corporations.md",
      limitations:
        "Within-set rankings only; employee results are scenarios with explicit assumptions, not observed payments.",
    },
    taxStatistics: {
      endpoint: "/api/v1/taxes",
      method: "GET",
      mcp: "query_taxes",
      datasets: ["income", "geography", "corporations"],
      coverage: {
        income: "2001–2023",
        states: 2023,
        zip: 2022,
        corporations: "13 selected companies, 2023–2026",
      },
      documentation: "/agents/taxes.md",
      downloads: ["/data/taxes.json", "/data/corporate-taxes.json"],
      limitations:
        "Individual income taxes are not all taxes. Race is not observed. Company cash and accounting expense are distinct.",
    },
    snapshots: fs
      .readdirSync(dataDir)
      .filter((n) => /^explore-.*\.json$/.test(n))
      .map((n) => {
        const r = read(n.slice(0, -5));
        return {
          id: n.slice(0, -5),
          url: "/data/" + n,
          source: r.source,
          retrievedAt: r.retrievedAt,
          query: r.query,
          measure: r.measure,
          unit: r.unit,
          records: Array.isArray(r.data) ? r.data.length : null,
          hasNext: r.hasNext,
        };
      }),
    links: {
      markdown: "/agents/README.md",
      mcp: "/mcp",
      discovery: "/llms.txt",
    },
  };
}
export function series(input) {
  const args = seriesSchema.parse(input),
    definition = definitions[args.dataset],
    all = rowsFor(definition).filter(
      (r) =>
        (args.from === undefined || r.year >= args.from) &&
        (args.to === undefined || r.year <= args.to),
    );
  const rows = all.slice(args.offset, args.offset + args.limit);
  return {
    schemaVersion: "1.0",
    dataset: args.dataset,
    measure: definition.title,
    unit: definition.unit,
    frequency: definition.frequency,
    source: provenanceFor(definition).source || definition.source,
    retrievedAt: provenanceFor(definition).retrievedAt,
    filters: { from: args.from ?? null, to: args.to ?? null },
    data: rows,
    pagination: {
      offset: args.offset,
      limit: args.limit,
      total: all.length,
      nextOffset:
        args.offset + rows.length < all.length
          ? args.offset + rows.length
          : null,
    },
    limitations: definition.notes,
  };
}
export const purchasingSchema = z.object({
  amount: z.number().finite().min(0).max(1e15),
  from: z.number().int(),
  to: z.number().int(),
});
export function purchasing(input) {
  const a = purchasingSchema.parse(input),
    rows = read("normalized").cpi,
    from = rows.find((r) => r.year === a.from),
    to = rows.find((r) => r.year === a.to);
  if (!from || !to)
    throw Error(
      "A requested year has no complete CPI average. Query the cpi catalog coverage; 2025 is unavailable.",
    );
  return {
    schemaVersion: "1.0",
    input: a,
    result: (a.amount * to.value) / from.value,
    unit: `${a.to} purchasing-power USD`,
    formula: "amount * CPI(to) / CPI(from)",
    observations: { from, to },
    source: "https://www.bls.gov/cpi/",
    retrievedAt: read("cpi").retrievedAt,
    limitations: [
      "Calendar-year CPI-U, not an exchange rate. Average consumer basket, not a household-specific measure.",
    ],
  };
}

export { awardSchema, searchAwards } from "./awards.mjs";
