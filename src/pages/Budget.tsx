import { useSearch, useSnapshot } from "../environment";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Download, Search } from "lucide-react";
import { download, money, readJSON } from "../data";
import type { FiscalStructure, Page, Data } from "../data";
import Chart from "../Chart";
const purposes: Record<string, string> = {
  "Social Security":
    "Retirement, disability, and survivor benefits. Most of this spending is not a procurement contract.",
  Medicare:
    "Federal health insurance, primarily for older people and certain people with disabilities.",
  Health:
    "Includes Medicaid and other health programs. Medicaid grants to states are a major part of this function.",
  "Net interest":
    "Interest paid on federal debt, net of interest receipts. It does not purchase a new public service.",
  "National Defense":
    "Defense activities across the government, including military personnel and procurement. This differs from the Defense Department’s budget.",
  "Income Security":
    "Includes retirement programs, nutrition assistance, unemployment compensation, and other income support.",
  "International Affairs":
    "Diplomacy and international programs. This budget function is not a measure of all money spent overseas.",
};
export default function Budget({
  go,
  data,
}: {
  go: (p: Page, extra?: Record<string, string>) => void;
  data: Data;
}) {
  const q = useSearch();
  const [structure, setStructure] = useState<FiscalStructure | null>(
      useSnapshot<FiscalStructure>("fiscal-structure"),
    ),
    [error, setError] = useState(""),
    [year, setYear] = useState(2025),
    [tab, setTab] = useState(q.get("tab") || "functions"),
    [selected, setSelected] = useState("Social Security"),
    [query, setQuery] = useState(""),
    [mode, setMode] = useState("Dollars"),
    [tax, setTax] = useState(10000);
  useEffect(() => {
    fetch("/data/fiscal-structure.json")
      .then(readJSON<FiscalStructure>)
      .then(setStructure)
      .catch((e) => setError(e.message));
  }, []);
  if (!structure)
    return (
      <section className="section subpage">
        <h1>The federal money map.</h1>
        <p role="status">{error || "Opening the budget ledgers…"}</p>
      </section>
    );
  const key = (
      ["revenue", "agencies"].includes(tab) ? tab : "functions"
    ) as keyof FiscalStructure,
    snapshot = structure[key],
    row = snapshot.data.find((r) => r.year === year)!,
    receipts = structure.revenue.data.find((r) => r.year === year)!,
    outlays = structure.functions.data.find((r) => r.year === year)!,
    gap = outlays.total - receipts.total;
  const items = row.items
      .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.amount - a.amount),
    active = row.items.find((r) => r.name === selected) || items[0],
    max = Math.max(...items.map((r) => Math.abs(r.amount)), 1);
  const history = snapshot.data
    .filter((r) => r.year >= 1971)
    .map((r) => ({
      year: r.year,
      value:
        mode === "Share of total"
          ? ((r.items.find((i) => i.name === active?.name)?.amount ?? 0) /
              r.total) *
            100
          : (r.items.find((i) => i.name === active?.name)?.amount ?? 0),
    }));
  const previous = snapshot.data
    .find((r) => r.year === year - 1)
    ?.items.find((i) => i.name === active?.name)?.amount;
  const pct = active ? (active.amount / row.total) * 100 : 0;
  const exportData = () =>
    download(
      `federal-${key}-${year}.csv`,
      row.items.map((i) => ({
        ...i,
        fiscal_year: year,
        unit: "USD",
        measure: key === "revenue" ? "Receipts" : "Net outlays",
        source: snapshot.source,
        retrieved_at: snapshot.retrievedAt,
      })),
    );
  return (
    <section className="section subpage budget-page">
      <div className="page-intro">
        <span className="eyebrow">FROM YOUR PAYCHECK TO THE PUBLIC LEDGER</span>
        <h1>Where does it all go?</h1>
        <p>
          Every budget has two sides. Explore who pays, what government funds,
          and the agencies moving the money.
        </p>
      </div>
      <div className="budget-controls">
        <label>
          Fiscal year{" "}
          <select
            aria-label="Money map fiscal year"
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          >
            {Array.from({ length: 55 }, (_, i) => 2025 - i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <span>Actuals · nominal USD · OMB FY 2027 vintage</span>
        <button className="text-link" onClick={exportData}>
          <Download size={14} /> Export this view
        </button>
      </div>
      <div className="fiscal-flow">
        <div className="flow-in">
          <span className="eyebrow">01 / MONEY IN</span>
          <strong>{money(receipts.total)}</strong>
          <p>Taxes & other receipts</p>
          {receipts.items.map((r, i) => (
            <button
              key={r.name}
              onClick={() => {
                setTab("revenue");
                setSelected(r.name);
                setQuery("");
              }}
            >
              <span>{r.name}</span>
              <b>{money(r.amount)}</b>
              <i
                style={{
                  width: `${(r.amount / receipts.total) * 100}%`,
                  opacity: 1 - i * 0.12,
                }}
              />
            </button>
          ))}
          <div className="flow-gap">
            <span>{gap >= 0 ? "Budget deficit" : "Budget surplus"}</span>
            <b>{money(Math.abs(gap))}</b>
          </div>
        </div>
        <div className="flow-bridge" aria-hidden="true">
          <span />
          <ArrowRight />
          <span />
          <small>
            THE FEDERAL
            <br />
            BUDGET
          </small>
        </div>
        <div className="flow-out">
          <span className="eyebrow">02 / MONEY OUT</span>
          <strong>{money(outlays.total)}</strong>
          <p>Total federal outlays</p>
          {[...outlays.items]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map((r, i) => (
              <button
                key={r.name}
                onClick={() => {
                  setTab("functions");
                  setSelected(r.name);
                  setQuery("");
                }}
              >
                <span>{r.name}</span>
                <b>{money(r.amount)}</b>
                <i
                  style={{
                    width: `${(r.amount / outlays.total) * 100}%`,
                    opacity: 1 - i * 0.12,
                  }}
                />
              </button>
            ))}
          <button
            className="flow-remainder"
            onClick={() => {
              setTab("functions");
              setQuery("");
              document
                .getElementById("budget-breakdown")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore every budget function <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <p className="source-caption">
        FY {year}. Receipts + deficit = net outlays (or receipts − surplus =
        outlays). The deficit is a financing gap, not tax revenue. Negative
        outlays and offsetting receipts remain in the detailed ledger below.
        OMB’s later publication vintage can differ from Treasury MTS figures on
        the overview.
      </p>
      <div className="section-heading" id="budget-breakdown">
        <div>
          <span className="eyebrow">OPEN THE LEDGER</span>
          <h2>Follow a category through time.</h2>
        </div>
      </div>
      <div className="budget-tabs" role="group" aria-label="Budget breakdown">
        {[
          ["functions", "What it funds"],
          ["revenue", "Who pays"],
          ["agencies", "Who spends it"],
        ].map(([v, l]) => (
          <button
            aria-pressed={tab === v}
            className={tab === v ? "active" : ""}
            key={v}
            onClick={() => {
              setTab(v);
              setQuery("");
              setSelected(
                v === "revenue"
                  ? "Individual income taxes"
                  : v === "agencies"
                    ? "Department of Health and Human Services"
                    : "Social Security",
              );
              historyReplace(v);
            }}
          >
            {l}
            <ArrowUpRight size={15} />
          </button>
        ))}
      </div>
      <div className="agency-workbench">
        <div className="budget-ranking">
          <div className="search-small">
            <Search size={16} />
            <input
              aria-label="Find a budget category"
              placeholder={
                key === "agencies" ? "Find an agency…" : "Find a category…"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="budget-rank-list">
            {items.map((r) => (
              <button
                key={r.name}
                aria-pressed={r.name === active?.name}
                className={r.name === active?.name ? "selected" : ""}
                onClick={() => setSelected(r.name)}
              >
                <span>{r.name}</span>
                <b>{money(r.amount)}</b>
                <i
                  className={r.amount < 0 ? "negative" : ""}
                  style={{ width: `${(Math.abs(r.amount) / max) * 100}%` }}
                />
              </button>
            ))}
            {!items.length && <p className="empty">No matching categories.</p>}
          </div>
        </div>
        {active && (
          <aside className="budget-inspector">
            <span className="eyebrow">
              {key === "revenue" ? "RECEIPTS" : "NET OUTLAYS"} / FY {year}
            </span>
            <h2>{active.name}</h2>
            <strong>{money(active.amount)}</strong>
            <p>
              {pct.toFixed(1)}% of federal{" "}
              {key === "revenue" ? "receipts" : "net outlays"}
              {previous !== undefined && previous !== 0
                ? ` · ${(((active.amount - previous) / Math.abs(previous)) * 100).toFixed(1)}% change from FY ${year - 1}`
                : ""}
            </p>
            <p className="category-explainer">
              {purposes[active.name] ||
                (key === "revenue"
                  ? "Reported federal receipts by source. Payroll-related social insurance receipts are separate from individual income taxes. Other receipts include customs duties, estate and gift taxes, and miscellaneous receipts."
                  : key === "agencies"
                    ? "Agency outlays include program payments and operating costs. Award searches show only the separately reported award records, so they will not reconcile to an agency’s total cash outlays."
                    : "A functional view groups spending by public purpose, across agency boundaries. Negative amounts can reflect credit-program reestimates or offsetting collections.")}
            </p>
            {key === "revenue" && (
              <p>
                <a
                  className="text-link"
                  href={
                    active.name.toLowerCase().includes("corporat")
                      ? "/taxes/corporations"
                      : "/taxes/income"
                  }
                >
                  {active.name.toLowerCase().includes("corporat")
                    ? "Inspect company tax disclosures"
                    : "Explore who pays income tax"}{" "}
                  <ArrowUpRight size={14} />
                </a>
              </p>
            )}
            <div className="segmented">
              {["Dollars", "Share of total"].map((m) => (
                <button
                  key={m}
                  className={mode === m ? "selected" : ""}
                  onClick={() => setMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <Chart
              points={history}
              label={active.name}
              percent={mode === "Share of total"}
            />
            <details>
              <summary>Exact historical observations</summary>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>FY</th>
                      <th>{mode === "Share of total" ? "Share" : "USD"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.year}>
                        <td>{r.year}</td>
                        <td>
                          {mode === "Share of total"
                            ? `${r.value.toFixed(3)}%`
                            : r.value.toLocaleString("en-US")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            {key === "agencies" && (
              <button
                className="btn dark"
                onClick={() =>
                  go("contracts", {
                    kind: "all",
                    agency: active.name
                      .replace("--Military Programs", "")
                      .replace(/ \((On|Off)-Budget\)/, ""),
                    start: `${year - 1}-10-01`,
                    end: `${year}-09-30`,
                  })
                }
                disabled={
                  year < 2008 ||
                  [
                    "Allowances",
                    "Undistributed Offsetting Receipts",
                    "Legislative Branch",
                    "Judicial Branch",
                    "Other Independent Agencies (On-Budget)",
                    "Other Independent Agencies (Off-Budget)",
                    "International Assistance Programs",
                    "Other Defense--Civil Programs",
                    "Corps of Engineers--Civil Works",
                  ].includes(active.name)
                }
              >
                Explore reported awards <ArrowRight size={15} />
              </button>
            )}
            {active.name === "Health" && (
              <button
                className="btn dark"
                onClick={() =>
                  go("contracts", { kind: "grants", program: "93.778" })
                }
              >
                Explore Medicaid grants <ArrowRight size={15} />
              </button>
            )}
            <a className="text-link" href={snapshot.source}>
              Open original OMB workbook <ArrowUpRight size={14} />
            </a>
          </aside>
        )}
      </div>
      <div className="tax-receipt panel">
        <div>
          <span className="eyebrow">MAKE IT PERSONAL</span>
          <h2>Your share of the priorities.</h2>
          <p>
            Allocate an illustrative tax payment using the FY {year} net
            spending mix. This is a proportional illustration, not a tracing of
            your payment or a tax estimate.
          </p>
          <label>
            Illustrative tax payment{" "}
            <input
              type="number"
              min={0}
              max={100000000}
              value={tax}
              onChange={(e) =>
                setTax(Math.max(0, Math.min(1e8, +e.target.value)))
              }
            />
          </label>
        </div>
        <div className="receipt-lines">
          {[...outlays.items]
            .sort((a, b) => b.amount - a.amount)
            .map((r) => (
              <div key={r.name}>
                <span>{r.name}</span>
                <b>{money((tax * r.amount) / outlays.total)}</b>
              </div>
            ))}
          <small>
            Includes negative offsets; minor rounding differences may occur.
            Shares are of net outlays, which include deficit-financed spending.
          </small>
        </div>
      </div>
      <div className="notice">
        Contract and assistance obligations are another accounting layer.
        Explore those records in{" "}
        <button className="text-link" onClick={() => go("atlas")}>
          the funding atlas <ArrowRight size={14} />
        </button>
        . {data.historicalBudget.length} years of total budget history remain
        available in Debt & the dollar.
      </div>
    </section>
  );
}
function historyReplace(tab: string) {
  const p = new URLSearchParams(location.search);
  p.set("tab", tab);
  window.history.replaceState({}, "", `?${p}`);
}
