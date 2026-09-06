import fs from "node:fs";
import { z } from "zod";
import { dataDir } from "./ledger.mjs";
import path from "node:path";
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(dataDir, name + ".json"), "utf8"));
export const taxSchema = z
  .object({
    dataset: z.enum(["income", "geography", "corporations"]).default("income"),
    year: z.coerce.number().int().optional(),
    state: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
    zip: z
      .string()
      .regex(/^\d{5}$/)
      .optional(),
    band: z.coerce.number().int().min(0).max(10).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(100),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();
export function queryTaxes(input = {}) {
  const q = taxSchema.parse(input),
    data = read("taxes");
  let rows, source, limitations, year;
  if (q.dataset === "income") {
    if (q.state || q.zip || q.band !== undefined)
      throw Error(
        "Income percentiles are national; use geography for state, ZIP or income-class filters.",
      );
    if (q.year && (q.year < 2001 || q.year > 2023))
      throw Error("Income percentile coverage is tax years 2001–2023.");
    rows = data.income.filter((r) => !q.year || r.year === q.year);
    source = data.sources["shares.xlsx"].url;
    limitations = data.limitations.income;
  } else if (q.dataset === "corporations") {
    if (q.state || q.zip || q.band !== undefined)
      throw Error(
        "Company disclosures cannot be filtered by geography or income class.",
      );
    if (q.year && ![2023, 2024, 2025, 2026].includes(q.year))
      throw Error(
        "Company disclosure coverage is fiscal years 2023–2026, with issuer-specific gaps.",
      );
    const c = read("corporate-taxes");
    rows = c.companies.map((c) => ({
      ...c,
      years: c.years.filter((r) => !q.year || r.year === q.year),
    }));
    source = "Source URLs accompany each company.";
    limitations = c.coverage;
  } else {
    year = q.zip ? data.zipYear : data.stateYear;
    if (q.year && q.year !== year)
      throw Error(`This geographic dataset covers tax year ${year}.`);
    if (q.state && !data.states.some((r) => r.state === q.state))
      throw Error("Unknown state code.");
    if (q.zip) {
      if (["00000", "99999"].includes(q.zip))
        throw Error(
          "00000 and 99999 are aggregate or disclosure buckets, not individual ZIP codes.",
        );
      if (q.band !== undefined && (q.band < 1 || q.band > 6))
        throw Error("ZIP income bands range from 1 to 6.");
      const indexed = read("tax-zip-index")[q.zip];
      rows = [];
      for (const state of q.state ? [q.state] : indexed ? [indexed] : []) {
        const file = path.join(dataDir, "tax-zip", state + ".json");
        if (!fs.existsSync(file)) continue;
        const found = JSON.parse(fs.readFileSync(file, "utf8"))[q.zip];
        if (found)
          rows.push(...found.map((r) => ({ state, zip: q.zip, ...r })));
      }
      source = data.sources["zip.csv"].url;
      limitations = data.limitations.zip;
    } else {
      rows = data.states.filter((r) => !q.state || r.state === q.state);
      source = data.sources["states.csv"].url;
      limitations = data.limitations.geography;
    }
    rows = rows.filter((r) => q.band === undefined || q.band === r.band);
  }
  return {
    dataset: q.dataset,
    year,
    units:
      "USD for monetary values; returns are counts; rates and shares are percentages.",
    retrievedAt: data.retrievedAt,
    source,
    limitations,
    filters: q,
    total: rows.length,
    offset: q.offset,
    hasMore: q.offset + q.limit < rows.length,
    rows: rows.slice(q.offset, q.offset + q.limit),
    ...(q.dataset === "geography"
      ? { incomeBands: q.zip ? data.zipBands : data.stateBands }
      : {}),
  };
}
