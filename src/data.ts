export type Award = {
  awardKind?: string;
  "Loan Value"?: number;
  "Subsidy Cost"?: number;
  "Place of Performance Country Code"?: string;
  "Assistance Listings"?: { cfda_number: string; cfda_program_title: string }[];
  "Award ID": string;
  "Recipient Name": string;
  "Award Amount": number;
  "Awarding Agency": string;
  Description: string;
  "Start Date": string;
  "End Date": string;
  "Place of Performance State Code": string;
  "Recipient UEI": string;
  generated_internal_id: string;
  internal_id: number;
};
export type Annual = {
  year: number;
  spending: number;
  revenue: number;
  date: string;
};
export type Data = {
  historicalBudget: { year: number; spending: number; revenue: number }[];
  governmentExpenditures: {
    year: number;
    total: number;
    federal: number;
    grants: number;
    stateLocalOwnSource: number;
  }[];
  cpiMonthly: { year: number; month: number; date: string; value: number }[];
  annual: Annual[];
  monthly: (Annual & { month: number; label: string })[];
  cpi: { year: number; value: number; months: number }[];
  departments: { name: string; amount: number }[];
  debtHistory: { year: number; debt: number }[];
};
export type Snapshot<T> = { data: T; retrievedAt: string; source: string };
export type StateRow = {
  shape_code: string;
  display_name: string;
  aggregated_amount: number;
  population: number;
  per_capita: number;
};
export const money = (n: number, d = 2) =>
  `${n < 0 ? "−" : ""}$${(Math.abs(n) / (Math.abs(n) >= 1e12 ? 1e12 : Math.abs(n) >= 1e9 ? 1e9 : Math.abs(n) >= 1e6 ? 1e6 : 1)).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d })}${Math.abs(n) >= 1e12 ? "T" : Math.abs(n) >= 1e9 ? "B" : Math.abs(n) >= 1e6 ? "M" : ""}`;
export function download(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const quote = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+@\t\r]/.test(s) || (/^-/.test(s) && !Number.isFinite(Number(s))))
      s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(
    [
      [keys, ...rows.map((r) => keys.map((k) => r[k]))]
        .map((r) => r.map(quote).join(","))
        .join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const stateCodes =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  );

export type Page = "taxes"
  | "overview"
  | "contracts"
  | "history"
  | "places"
  | "methodology"
  | "saved"
  | "budget"
  | "atlas"
  | "organizations";
export const sources = {
  treasury: "https://fiscaldata.treasury.gov/",
  usa: "https://www.usaspending.gov/",
  bls: "https://www.bls.gov/cpi/",
  history:
    "https://www.federalreservehistory.org/essays/gold-convertibility-ends",
};

/** Never display a JSON parser error or render upstream HTML as source data. */
export async function readJSON<T>(response: Response): Promise<T> {
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "The data service returned an unexpected response. Please retry; the API may be unavailable.",
    );
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The data service returned an incomplete response. Please retry.",
    );
  }
  if (!response.ok)
    throw new Error(
      data.error ||
        `The data service is temporarily unavailable (${response.status}).`,
    );
  return data as T;
}
export type AwardKind =
  "all" | "contracts" | "grants" | "direct" | "other" | "loans";
export const kindLabels: Record<AwardKind, string> = {
  all: "All non-loan awards",
  contracts: "Contracts",
  grants: "Grants",
  direct: "Direct payments",
  other: "Other assistance",
  loans: "Loans",
};
export type FiscalRow = {
  year: number;
  total: number;
  items: { name: string; amount: number }[];
};
export type FiscalStructure = Record<
  "revenue" | "functions" | "agencies",
  Snapshot<FiscalRow[]>
>;
export type AggregateRow = {
  name: string;
  amount: number;
  code: string;
  id?: number;
  recipient_id?: string;
};
export type ExploreResult<T> = Snapshot<T> & {
  hasNext: boolean;
  measure: string;
  filters?: Record<string, unknown>;
};
