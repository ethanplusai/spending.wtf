import { useState } from "react";
import { ArrowUpRight, Download, Search } from "lucide-react";
import type { CorporateData, Company } from "../corporate";
import { estimateWorkforce } from "../../shared/workforce-model.mjs";
import type { Assumptions } from "../../shared/workforce-model.mjs";
import { money, download } from "../data";
import Chart from "../Chart";
const format = (n: number | null | undefined) =>
  n == null ? "Not captured" : money(n);
const measures = {
  federalCash: "U.S. federal cash income taxes",
  worldwideCash: "Worldwide cash income taxes",
  federalCurrentExpense: "U.S. federal current tax expense",
} as const;
export default function CorporateExplorer({ data }: { data: CorporateData }) {
  const [mode, setMode] = useState<"reported" | "workforce">("reported"),
    [year, setYear] = useState(2025),
    [metric, setMetric] = useState<keyof typeof measures>("federalCash"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState("MSFT");
  const [assumptions, setAssumptions] = useState<Assumptions>({
    annualTaxablePay: 75000,
    effectiveRate: 15,
    assumedUSShare: 50,
    includeAssumedUS: false,
  });
  const company =
    data.companies.find((c) => c.ticker === selected) ?? data.companies[0];
  const years = [
    ...new Set(data.companies.flatMap((c) => c.years.map((y) => y.year))),
  ].sort((a, b) => b - a);
  const rows = data.companies
    .map((c) => {
      const observation = c.years.find((y) => y.year === year),
        estimate = estimateWorkforce(c, assumptions);
      return {
        company: c,
        observation,
        estimate,
        amount:
          mode === "reported"
            ? (observation?.[metric] ?? null)
            : (estimate?.employeeIncomeTax ?? null),
      };
    })
    .filter((r) =>
      (r.company.name + " " + r.company.ticker)
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      a.amount === null
        ? b.amount === null
          ? a.company.name.localeCompare(b.company.name)
          : 1
        : b.amount === null
          ? -1
          : b.amount - a.amount || a.company.name.localeCompare(b.company.name),
    );
  const observed = rows.filter((r) => r.amount !== null);
  const largest = Math.max(...observed.map((r) => Math.abs(r.amount!)), 1);
  function exportRows() {
    download(
      `corporate-${mode}-${mode === "reported" ? year : "scenario"}.csv`,
      rows.map((r) => ({
        company: r.company.name,
        ticker: r.company.ticker,
        classification:
          mode === "reported"
            ? "Reported company disclosure"
            : "Illustrative employee scenario",
        measure:
          mode === "reported"
            ? measures[metric]
            : "Employee federal income tax scenario",
        companyFiscalYear: mode === "reported" ? year : "",
        periodEnd:
          mode === "reported"
            ? (r.observation?.periodEnd ?? "")
            : (r.company.workforce?.date ?? ""),
        usd: r.amount ?? "",
        ...(mode === "workforce"
          ? {
              annualTaxablePay: assumptions.annualTaxablePay,
              effectiveRatePercent: assumptions.effectiveRate,
              assumedUSSharePercent: assumptions.assumedUSShare,
              useAssumedUS: assumptions.includeAssumedUS,
              usBasis: r.estimate?.usBasis ?? "No US count",
              lowScenario: r.estimate?.low ?? "",
              highScenario: r.estimate?.high ?? "",
            }
          : {}),
        source:
          mode === "reported"
            ? r.company.source
            : (r.company.workforce?.source ?? ""),
        notes: r.company.notes,
      })),
    );
  }
  return (
    <section className="corporate-explorer">
      <div className="tax-section-heading">
        <div>
          <span className="eyebrow">03 / THE COMPANY LEDGER</span>
          <h2>
            Who pays the most?
            <br />
            Start with the evidence.
          </h2>
          <p>
            {data.companies.length} major companies ·{" "}
            {data.companies.reduce((n, c) => n + c.years.length, 0)}{" "}
            company-years · primary filings linked throughout
          </p>
        </div>
        <a href="/agents/corporations.md">
          Data & model guide <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="corporate-mode">
        <button
          aria-pressed={mode === "reported"}
          onClick={() => setMode("reported")}
        >
          <span>01 / REPORTED</span>
          <strong>Company income taxes</strong>
          <small>Cash and expense, straight from filings</small>
        </button>
        <button
          aria-pressed={mode === "workforce"}
          onClick={() => setMode("workforce")}
        >
          <span>02 / MODELED</span>
          <strong>The employee tax footprint</strong>
          <small>Change the assumptions. See the scale.</small>
        </button>
      </div>
      {mode === "workforce" && (
        <div className="workforce-assumptions">
          <h3>
            What if average annual taxable pay were{" "}
            {format(assumptions.annualTaxablePay)}?
          </h3>
          <p>
            This is a standardized scenario, not an estimate of each company’s
            actual payroll. Employees pay these income taxes. They are not the
            corporation’s income taxes or taxes uniquely caused by these jobs.
          </p>
          <div className="tax-geo-controls">
            <label>
              Annual taxable pay per worker (USD)
              <input
                type="number"
                min="0"
                max="1000000"
                step="5000"
                value={assumptions.annualTaxablePay}
                onChange={(e) =>
                  setAssumptions({
                    ...assumptions,
                    annualTaxablePay: Math.min(
                      1000000,
                      Math.max(0, +e.target.value),
                    ),
                  })
                }
              />
            </label>
            <label>
              Effective federal income-tax rate (%)
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={assumptions.effectiveRate}
                onChange={(e) =>
                  setAssumptions({
                    ...assumptions,
                    effectiveRate: Math.min(50, Math.max(0, +e.target.value)),
                  })
                }
              />
            </label>
            <label>
              Assumed U.S. share when missing (%)
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                disabled={!assumptions.includeAssumedUS}
                value={assumptions.assumedUSShare}
                onChange={(e) =>
                  setAssumptions({
                    ...assumptions,
                    assumedUSShare: Math.min(100, Math.max(0, +e.target.value)),
                  })
                }
              />
            </label>
          </div>
          <label className="corporate-check">
            <input
              type="checkbox"
              checked={assumptions.includeAssumedUS}
              onChange={(e) =>
                setAssumptions({
                  ...assumptions,
                  includeAssumedUS: e.target.checked,
                })
              }
            />{" "}
            Include companies with an assumed U.S. workforce share
          </label>
          <p className="tax-note">
            Reported U.S. counts take precedence. Pay and rate are user
            assumptions for every company. No payroll, sales, property or
            corporate taxes are included. The effective rate incorporates
            assumed deductions and credits; this is not a marginal bracket
            calculation.
          </p>
        </div>
      )}
      <div className="corporate-filters">
        <label>
          <span>Find a company</span>
          <div className="corporate-search">
            <Search size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or ticker"
            />
          </div>
        </label>
        {mode === "reported" && (
          <>
            <label>
              Company fiscal year
              <select value={year} onChange={(e) => setYear(+e.target.value)}>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
            <label>
              Reported measure
              <select
                value={metric}
                onChange={(e) =>
                  setMetric(e.target.value as keyof typeof measures)
                }
              >
                {Object.entries(measures).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <button className="btn" onClick={exportRows}>
          <Download size={14} /> Export this comparison
        </button>
      </div>
      <div className="corporate-coverage">
        <b>
          {observed.length} / {rows.length}
        </b>
        <span>
          {mode === "reported"
            ? "matching companies have this measure for the selected fiscal year. Ranking is within this research set only."
            : "matching companies have a scenario under the current assumptions. Workforce dates vary; this is not a fiscal-year ranking."}
        </span>
      </div>
      <div className="corporate-ledger" id="corporate-comparison">
        <div className="corporate-ledger-head">
          <span>Within-set rank / company</span>
          <span>
            {mode === "reported"
              ? measures[metric]
              : "Modeled annual employee income tax"}
          </span>
        </div>
        {rows.map((r, i) => (
          <button
            className={selected === r.company.ticker ? "selected" : ""}
            key={r.company.cik}
            aria-pressed={selected === r.company.ticker}
            aria-controls="corporate-detail"
            onClick={() => {
              setSelected(r.company.ticker);
              requestAnimationFrame(() => {
                const detail = document.getElementById("corporate-detail");
                detail?.focus({ preventScroll: true });
                detail?.scrollIntoView({
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                  block: "start",
                });
              });
            }}
          >
            <span className="corporate-rank">
              {r.amount === null ? "—" : String(i + 1).padStart(2, "0")}
            </span>
            <span className="corporate-name">
              <b>{r.company.name}</b>
              <small>
                {r.company.ticker} ·{" "}
                {mode === "reported"
                  ? (r.observation?.periodEnd ?? "No period captured")
                  : r.company.workforce?.date}
                {r.company.ticker === "TGT" &&
                metric === "federalCash" &&
                mode === "reported"
                  ? " · includes credit purchases"
                  : ""}
              </small>
            </span>
            <span
              className={
                "corporate-bar " + (mode === "workforce" ? "modeled" : "")
              }
            >
              <i
                style={{
                  width: `${r.amount === null ? 0 : (Math.abs(r.amount) / largest) * 100}%`,
                }}
                className={(r.amount ?? 0) < 0 ? "refund" : ""}
              />
            </span>
            <span className="corporate-amount">
              <strong>{format(r.amount)}</strong>
              <small>
                {mode === "workforce"
                  ? (r.estimate?.usBasis ?? "US workforce not captured")
                  : r.amount !== null && r.amount < 0
                    ? "Net refund"
                    : r.amount === null
                      ? "Not zero"
                      : "Reported"}
              </small>
            </span>
          </button>
        ))}
        {!rows.length && (
          <p className="empty">No companies match this search.</p>
        )}
      </div>
      <p className="tax-source">
        {data.coverage} {data.selection}
      </p>
      <div id="corporate-detail" tabIndex={-1}>
        <a className="corporate-back" href="#corporate-comparison">
          ↑ Back to comparison
        </a>
        {mode === "reported" ? (
          <CompanyReport company={company} year={year} />
        ) : (
          <WorkforceReport company={company} assumptions={assumptions} />
        )}
      </div>
      <aside className="corporate-next">
        <h3>What this comparison can—and cannot—tell you</h3>
        <p>
          Cash payments can move sharply because of refunds, settlements,
          deferred payment schedules and tax-credit rules. One year is not a
          long-run tax burden. The list is a reviewed research set, not all top
          companies or a national taxpayer ranking.
        </p>
        <p>
          To expand systematically, use SEC XBRL cash-tax disclosures with
          filing context and human review of jurisdiction-specific tax notes.
          Private companies and missing disclosures remain coverage gaps.
          Employee modeling additionally needs U.S. workforce, taxable
          compensation and tax-situation assumptions.
        </p>
        <a href="https://www.sec.gov/data-research/sec-markets-data/financial-statement-data-sets">
          SEC bulk disclosure datasets ↗
        </a>{" "}
        ·{" "}
        <a href="/data/corporate-taxes.json">
          Download the reviewed observations ↗
        </a>
      </aside>
    </section>
  );
}
function CompanyReport({ company, year }: { company: Company; year: number }) {
  const row = company.years.find((r) => r.year === year);
  return (
    <article className="tax-company-report">
      <div>
        <span className="eyebrow">
          {company.name} /{" "}
          {row
            ? `FY ${year} · ENDED ${row.periodEnd}`
            : `FY ${year} NOT CAPTURED`}
        </span>
        <h3>
          Cash and accounting
          <br />
          tell different stories.
        </h3>
      </div>
      <div className="tax-company-metrics">
        {Object.entries(measures).map(([key, label]) => (
          <article key={key}>
            <span>{label}</span>
            <strong>{format(row?.[key as keyof typeof measures])}</strong>
            <p>
              {key === "federalCurrentExpense"
                ? "Current accounting provision. Not cash paid."
                : key === "worldwideCash"
                  ? "Across jurisdictions. See source notes for payment basis."
                  : "Reported federal cash measure; negative values are net refunds."}
            </p>
          </article>
        ))}
      </div>
      <p className="corporate-report-note">
        {company.notes ||
          "Missing measures have not been captured from the selected source; they are not assumed to be zero."}
      </p>
      <a href={company.source}>
        {company.sourceNote} <ArrowUpRight size={14} />
      </a>
      <p className="corporate-report-note">
        CIK {company.cik}
        {company.accession ? " · accession " + company.accession : ""}
      </p>
      <div
        className="tax-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Scrollable corporate data table"
      >
        <table>
          <caption>{company.name} · captured observations · USD</caption>
          <thead>
            <tr>
              <th scope="col">Fiscal year / period end</th>
              <th scope="col">Federal cash</th>
              <th scope="col">Worldwide cash</th>
              <th scope="col">Federal current expense</th>
            </tr>
          </thead>
          <tbody>
            {company.years.map((y) => (
              <tr key={y.year}>
                <th scope="row">
                  {y.year} / {y.periodEnd}
                </th>
                <td>{format(y.federalCash)}</td>
                <td>{format(y.worldwideCash)}</td>
                <td>{format(y.federalCurrentExpense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
function WorkforceReport({
  company,
  assumptions,
}: {
  company: Company;
  assumptions: Assumptions;
}) {
  const w = company.workforce,
    e = estimateWorkforce(company, assumptions);
  return (
    <article className="workforce-report">
      <span className="eyebrow">{company.name} / ILLUSTRATIVE MODEL</span>
      <h3>The workers behind the company.</h3>
      {w ? (
        <>
          <div className="tax-detail-grid">
            <div className="tax-focus">
              <span>Reported worldwide workforce</span>
              <strong>{w.global.toLocaleString("en-US")}</strong>
              <p>As of {w.date}</p>
              <dl>
                <div>
                  <dt>U.S. workforce</dt>
                  <dd>
                    {w.us === null
                      ? "Not captured"
                      : w.us.toLocaleString("en-US")}
                    {w.usDerived ? " (derived)" : ""}
                  </dd>
                </div>
                <div>
                  <dt>Scenario U.S. workers</dt>
                  <dd>
                    {e?.estimatedUSWorkers.toLocaleString("en-US") ??
                      "Assumption required"}
                  </dd>
                </div>
              </dl>
              <p className="tax-note">{w.note}</p>
              <a href={w.source}>Workforce source ↗</a>
            </div>
            <div className="workforce-result">
              <span>MODELED ANNUAL EMPLOYEE FEDERAL INCOME TAX</span>
              <strong>{format(e?.employeeIncomeTax)}</strong>
              {e ? (
                <>
                  <p>
                    {format(e.low)}–{format(e.high)} sensitivity range
                  </p>
                  <p className="tax-note">{e.sensitivity}</p>
                  <dl>
                    <div>
                      <dt>Assumed annual taxable payroll</dt>
                      <dd>{format(e.annualTaxablePayroll)}</dd>
                    </div>
                    <div>
                      <dt>Workforce basis</dt>
                      <dd>{e.usBasis}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p>
                  U.S. workforce is not captured. Enable an assumed U.S. share
                  above to explore a scenario.
                </p>
              )}
            </div>
          </div>
          {e && (
            <>
              <h4>How sensitive is this to the assumed effective rate?</h4>
              <Chart
                points={[5, 10, 15, 20, 25, 30].map((rate) => ({
                  year: rate,
                  label: rate + "% rate",
                  value: (e.annualTaxablePayroll * rate) / 100,
                }))}
                label="Modeled employee federal income tax"
              />
              <p className="tax-note">
                Sensitivity curve, not historical time. Taxable pay and
                workforce held fixed.
              </p>
            </>
          )}
          <details>
            <summary>Formula, uncertainty & interpretation</summary>
            {e && (
              <div
                className="tax-table-wrap"
                tabIndex={0}
                role="region"
                aria-label="Scrollable corporate data table"
              >
                <table>
                  <caption>Exact rate-sensitivity scenarios · USD</caption>
                  <thead>
                    <tr>
                      <th scope="col">Assumed effective rate</th>
                      <th scope="col">Modeled annual employee income tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[5, 10, 15, 20, 25, 30].map((rate) => (
                      <tr key={rate}>
                        <th scope="row">{rate}%</th>
                        <td>
                          {(
                            (e.annualTaxablePayroll * rate) /
                            100
                          ).toLocaleString("en-US")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p>
              Annual employee income tax = U.S. workforce × assumed annual
              taxable pay per worker × assumed effective federal income-tax
              rate. Period-end headcount or FTE is used as a full-year workforce
              proxy. Turnover, seasonal work, hours, compensation mix,
              retirement contributions, filing status, dependents, other
              household income, deductions and credits can materially change
              actual tax payments.
            </p>
            <p>
              These are employee liabilities, not company income tax. We do not
              add the model to reported corporate cash or claim that these taxes
              would disappear if a particular company did not exist. Ranges are
              deliberate stress scenarios, not statistical confidence intervals.
            </p>
          </details>
        </>
      ) : (
        <p>No workforce disclosure is captured for this company.</p>
      )}
    </article>
  );
}
