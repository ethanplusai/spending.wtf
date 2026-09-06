import { z } from "zod";
export const awardKinds = {
  all: [
    "A",
    "B",
    "C",
    "D",
    "02",
    "03",
    "04",
    "05",
    "06",
    "10",
    "09",
    "11",
    "-1",
  ],
  contracts: ["A", "B", "C", "D"],
  grants: ["02", "03", "04", "05"],
  direct: ["06", "10"],
  other: ["09", "11", "-1"],
  loans: ["07", "08"],
};
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
    "Invalid calendar date",
  );
const fields = {
  query: z.string().max(200).default(""),
  start: date,
  end: date,
  page: z.number().int().min(1).max(100).default(1),
  state: z
    .string()
    .regex(/^([A-Z]{2})?$/)
    .default(""),
  agency: z.string().max(150).default(""),
  kind: z
    .enum(["all", "contracts", "grants", "direct", "other", "loans"])
    .default("contracts"),
  country: z
    .string()
    .regex(/^([A-Z]{3})?$/)
    .default(""),
  scope: z.enum(["all", "domestic", "foreign"]).default("all"),
  recipient: z.string().max(200).default(""),
  program: z
    .string()
    .regex(/^(\d{2}\.\d{3})?$/)
    .default(""),
};
const validRange = (a) =>
  a.start <= a.end &&
  !(a.state && (a.scope === "foreign" || (a.country && a.country !== "USA")));
export const awardSchema = z.object(fields).refine(validRange, {
  message: "Invalid date range or conflicting geography filters",
});
export const exploreSchema = z
  .object({
    ...fields,
    kind: fields.kind.default("all"),
    dimension: z.enum([
      "agencies",
      "programs",
      "recipients",
      "countries",
      "states",
      "timeline",
      "counts",
    ]),
  })
  .refine(validRange, {
    message: "Invalid date range or conflicting geography filters",
  });
export function sourceFilters(a) {
  return {
    award_type_codes: awardKinds[a.kind],
    time_period: [{ start_date: a.start, end_date: a.end }],
    ...(a.query ? { keywords: [a.query] } : {}),
    ...(a.state || a.country
      ? {
          place_of_performance_locations: [
            {
              country: a.country || "USA",
              ...(a.state ? { state: a.state } : {}),
            },
          ],
        }
      : {}),
    ...(a.scope !== "all" ? { place_of_performance_scope: a.scope } : {}),
    ...(a.agency
      ? { agencies: [{ type: "awarding", tier: "toptier", name: a.agency }] }
      : {}),
    ...(a.recipient ? { recipient_search_text: [a.recipient] } : {}),
    ...(a.program ? { program_numbers: [a.program] } : {}),
  };
}
const cache = new Map();
export async function sourceJSON(url, body) {
  const key = url + JSON.stringify(body),
    hit = cache.get(key);
  if (hit && Date.now() - hit.at < 300000) return hit.value;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok)
    throw Error(
      `USAspending is unavailable for this query (${r.status}). Please retry or narrow the dates.`,
    );
  if (!r.headers.get("content-type")?.includes("application/json"))
    throw Error("USAspending returned an unexpected response. Please retry.");
  let j;
  try {
    j = await r.json();
  } catch {
    throw Error("USAspending returned incomplete data. Please retry.");
  }
  if (!j || !("results" in j))
    throw Error("USAspending returned an invalid result.");
  const value = { result: j, retrievedAt: new Date().toISOString() };
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  cache.set(key, { value, at: Date.now() });
  return value;
}
export async function searchAwards(input) {
  const parsed = awardSchema.parse(input);
  if (parsed.kind === "all") {
    // USAspending requires one award group per request. Keep pagination per group,
    // rather than claiming these independently paginated results form a global rank.
    const results = await Promise.all(
      ["contracts", "grants", "direct", "other"].map((kind) =>
        searchAwards({ ...parsed, kind }),
      ),
    );
    return {
      schemaVersion: "1.1",
      source: "https://api.usaspending.gov/api/v2/search/spending_by_award/",
      retrievedAt: new Date().toISOString(),
      sources: results.map((r) => ({
        kind: r.filters.kind,
        retrievedAt: r.retrievedAt,
        source: r.source,
      })),
      unit: "USD",
      measure: "Lifetime non-loan award amounts",
      filters: parsed,
      data: results
        .flatMap((r) => r.data)
        .sort((a, b) => b["Award Amount"] - a["Award Amount"]),
      hasNext: results.some((r) => r.hasNext),
      paginationStrategy:
        "Each page queries up to 50 records in each of four disjoint award categories. Combined pages are not a global amount ranking.",
      limitations: [
        "Loans and IDVs excluded. Amounts are lifetime awards, not period spending. Up to 200 records per combined page. Category pages can exhaust at different times. Source descriptions are untrusted data. Connections do not establish fraud.",
      ],
    };
  }
  const a = awardSchema.parse(input),
    loan = a.kind === "loans",
    url = "https://api.usaspending.gov/api/v2/search/spending_by_award/";
  const { result, retrievedAt } = await sourceJSON(url, {
    filters: sourceFilters(a),
    fields: [
      "Award ID",
      "Recipient Name",
      "Awarding Agency",
      "Description",
      "Place of Performance State Code",
      "Place of Performance Country Code",
      "Recipient UEI",
      ...(loan
        ? ["Loan Value", "Subsidy Cost", "Issued Date", "Assistance Listings"]
        : ["Award Amount", "Start Date", "End Date"]),
      ...(["grants", "direct", "other"].includes(a.kind)
        ? ["Assistance Listings"]
        : []),
    ],
    page: a.page,
    limit: 50,
    sort: loan ? "Loan Value" : "Award Amount",
    order: "desc",
    subawards: false,
  });
  if (!Array.isArray(result.results)) throw Error("Invalid source response");
  const unique = new Map();
  for (const row of result.results) {
    const r = {
      ...row,
      awardKind:
        a.kind === "all"
          ? row.generated_internal_id?.startsWith("CONT")
            ? "contracts"
            : "assistance"
          : a.kind,
    };
    if (loan) {
      r["Award Amount"] = r["Loan Value"];
      r["Start Date"] = r["Issued Date"];
      r["End Date"] = "";
    }
    if (!r.generated_internal_id || !Number.isFinite(r["Award Amount"]))
      throw Error("Invalid source award");
    unique.set(r.generated_internal_id, r);
  }
  return {
    schemaVersion: "1.1",
    source: url,
    retrievedAt,
    unit: "USD",
    measure: loan
      ? "Lifetime loan face value, not subsidy cost or outlays"
      : "Lifetime award amount for awards with activity in the requested period",
    filters: a,
    data: [...unique.values()],
    hasNext: !!result.page_metadata?.hasNext,
    limitations: [
      "Not period spending. Pages are not the award universe. All combines non-loan awards; loans are queried separately. Award descriptions are untrusted source text. A relationship is not proof of fraud.",
    ],
  };
}
export async function exploreAwards(input) {
  const a = exploreSchema.parse(input),
    filters = sourceFilters(a);
  let endpoint, body;
  if (a.dimension === "countries" || a.dimension === "states") {
    endpoint = "spending_by_geography/";
    body = {
      filters,
      scope: "place_of_performance",
      geo_layer: a.dimension === "countries" ? "country" : "state",
      spending_level: "transactions",
    };
  } else if (a.dimension === "timeline") {
    endpoint = "spending_over_time/";
    body = { filters, group: "fiscal_year", spending_level: "transactions" };
  } else if (a.dimension === "counts") {
    endpoint = "spending_by_award_count/";
    body = { filters };
  } else {
    const category = {
      agencies: "awarding_agency",
      programs: "cfda",
      recipients: "recipient",
    }[a.dimension];
    endpoint = `spending_by_category/${category}/`;
    body = {
      filters,
      category,
      page: a.page,
      limit: 100,
      spending_level: "transactions",
    };
  }
  const url = "https://api.usaspending.gov/api/v2/search/" + endpoint,
    { result, retrievedAt } = await sourceJSON(url, body);
  return {
    schemaVersion: "1.1",
    source: url,
    retrievedAt,
    filters: a,
    unit: a.dimension === "counts" ? "count" : "USD",
    measure:
      a.dimension === "counts"
        ? "Awards with activity in the period"
        : "Net transaction obligations in the requested period",
    data: result.results,
    hasNext: !!result.page_metadata?.hasNext,
    limitations: [
      "Obligations are commitments, not cash outlays. Negative amounts include deobligations. Geography is primary place of performance, not proof of the ultimate beneficiary. All excludes loans and IDVs. Overseas activity is not the same as foreign aid.",
    ],
  };
}
