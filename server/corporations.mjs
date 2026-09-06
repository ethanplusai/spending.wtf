import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { dataDir } from "./ledger.mjs";
import { estimateWorkforce } from "../shared/workforce-model.mjs";
const read = () =>
  JSON.parse(
    fs.readFileSync(path.join(dataDir, "corporate-taxes.json"), "utf8"),
  );
export const corporateRankSchema = z
  .object({
    year: z.coerce.number().int().default(2025),
    measure: z
      .enum(["federalCash", "worldwideCash", "federalCurrentExpense"])
      .default("federalCash"),
    query: z.string().max(100).default(""),
    limit: z.coerce.number().int().min(1).max(100).default(100),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();
export function rankCorporateTaxes(input = {}) {
  const q = corporateRankSchema.parse(input),
    data = read();
  if (!data.companies.some((c) => c.years.some((y) => y.year === q.year)))
    throw Error("Requested fiscal year is not captured.");
  const rows = data.companies
    .filter((c) =>
      (c.name + " " + c.ticker + " " + c.cik)
        .toLowerCase()
        .includes(q.query.toLowerCase()),
    )
    .map((c) => {
      const observation = c.years.find((y) => y.year === q.year);
      return {
        name: c.name,
        ticker: c.ticker,
        cik: c.cik,
        periodEnd: observation?.periodEnd ?? null,
        amount: observation?.[q.measure] ?? null,
        source: c.source,
        notes: c.notes,
        reviewedAt: c.reviewedAt,
      };
    })
    .sort((a, b) =>
      a.amount === null
        ? b.amount === null
          ? a.name.localeCompare(b.name)
          : 1
        : b.amount === null
          ? -1
          : b.amount - a.amount || a.name.localeCompare(b.name),
    )
    .map((r, i) => ({ ...r, rank: r.amount === null ? null : i + 1 }));
  return {
    classification: "Reported disclosures",
    measure: q.measure,
    unit: "USD",
    fiscalYear: q.year,
    filters: q,
    coverage: data.coverage,
    selection: data.selection,
    measured: rows.filter((r) => r.amount !== null).length,
    total: rows.length,
    hasMore: q.offset + q.limit < rows.length,
    rows: rows.slice(q.offset, q.offset + q.limit),
  };
}
export const employeeEstimateSchema = z
  .object({
    ticker: z.string().max(12).optional(),
    annualTaxablePay: z.number().finite().min(0).max(1000000),
    effectiveRate: z.number().finite().min(0).max(50),
    assumedUSShare: z.number().finite().min(0).max(100).default(50),
    includeAssumedUS: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(100),
    offset: z.number().int().min(0).default(0),
  })
  .strict();
export function estimateEmployeeTaxes(input) {
  const q = employeeEstimateSchema.parse(input),
    data = read(),
    companies = data.companies.filter(
      (c) => !q.ticker || c.ticker === q.ticker.toUpperCase(),
    );
  if (q.ticker && !companies.length)
    throw Error("Ticker not in the reviewed research set.");
  const assumptions = {
    annualTaxablePay: q.annualTaxablePay,
    effectiveRate: q.effectiveRate,
    assumedUSShare: q.assumedUSShare,
    includeAssumedUS: q.includeAssumedUS,
  };
  const rows = companies
    .map((c) => ({
      name: c.name,
      ticker: c.ticker,
      workforce: c.workforce,
      estimate: estimateWorkforce(c, assumptions),
    }))
    .sort(
      (a, b) =>
        (b.estimate?.employeeIncomeTax ?? -Infinity) -
        (a.estimate?.employeeIncomeTax ?? -Infinity),
    );
  return {
    classification:
      "Illustrative annual employee federal income-tax scenario, not observed payments",
    unit: "USD",
    formula:
      "US workforce * assumed annual taxable pay * assumed effective federal income-tax rate / 100",
    assumptions,
    limitations: [
      "Not company-specific payroll estimates. Shared scenario assumptions are not reported wages or tax rates.",
      "Period-end headcount/FTE is a full-year proxy; hours, turnover, credits, deductions and household tax situations are unknown.",
      "Employee income taxes are not corporate income taxes. Do not sum into a claimed corporate tax contribution or causal tax benefit.",
      "Workforce observation dates vary. Sensitivity bounds are not confidence intervals.",
    ],
    total: rows.length,
    hasMore: q.offset + q.limit < rows.length,
    rows: rows.slice(q.offset, q.offset + q.limit),
  };
}
