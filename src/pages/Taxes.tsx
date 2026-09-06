import CorporateExplorer from "../components/CorporateExplorer";
import type { CorporateData } from "../corporate";
import { useEffect, useState } from "react";
import { ArrowUpRight, Download, Search } from "lucide-react";
import { useSearch, useSnapshot } from "../environment";
import { money, readJSON } from "../data";
import Chart from "../Chart";
type Values = {
  returns: number | null;
  agi: number | null;
  incomeTax: number | null;
  totalLiability: number | null;
};
type Geo = Values & { state: string; band: number };
type Group = {
  returns: number;
  agi: number;
  tax: number;
  floor: number | null;
};
type Band = {
  label: string;
  returns: number;
  agi: number;
  tax: number;
  taxShare: number;
  incomeShare: number;
  averageRate: number | null;
};
type TaxYear = { year: number; groups: Record<string, Group>; bands: Band[] };
export type TaxesData = {
  retrievedAt: string;
  income: TaxYear[];
  states: Geo[];
  stateBands: string[];
  zipBands: string[];
  zipCount: number;
  stateYear: number;
  zipYear: number;
  limitations: Record<string, string>;
  sources: Record<string, { url: string }>;
  incomeDefinition: string;
};
const tabs = [
  ["summary", "Start here"],
  ["income", "Income groups"],
  ["geography", "States & ZIP codes"],
  ["corporations", "Corporations"],
] as const;
const value = (n: number | null | undefined) =>
  n == null ? "Not available" : money(n);
const pct = (n: number) => n.toFixed(1) + "%";
export default function Taxes() {
  const search = useSearch();
  const [data, setData] = useState(useSnapshot<TaxesData>("taxes"));
  const [corporate, setCorporate] = useState(
    useSnapshot<CorporateData>("corporate-taxes"),
  );
  const initial =
    typeof location === "undefined"
      ? search.get("taxTab")
      : location.pathname.split("/")[2] || search.get("tab");
  const [tab, setTab] = useState(
    initial && tabs.some(([id]) => id === initial) ? initial : "summary",
  );
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/data/taxes.json", { signal: controller.signal }).then(
        readJSON<TaxesData>,
      ),
      fetch("/data/corporate-taxes.json", { signal: controller.signal }).then(
        readJSON<CorporateData>,
      ),
    ])
      .then(([t, c]) => {
        setData(t);
        setCorporate(c);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    const pop = () => {
      const next = location.pathname.split("/")[2];
      setTab(tabs.some(([key]) => key === next) ? next : "summary");
    };
    window.addEventListener("popstate", pop);
    return () => {
      controller.abort();
      window.removeEventListener("popstate", pop);
    };
  }, []);
  if (!data)
    return (
      <section className="tax-page">
        <h1>Who pays federal taxes?</h1>
        <p>{error || "Loading the IRS public tables…"}</p>
      </section>
    );
  return (
    <div className="tax-page">
      <section className="tax-intro">
        <div className="eyebrow">
          THE REVENUE SIDE / IRS STATISTICS OF INCOME
        </div>
        <h1>
          Who pays
          <br />
          <em>the bill?</em>
        </h1>
        <p>
          Follow federal income taxes through income groups, filing addresses,
          and public-company reports. Every number has a scope. Every scope has
          a limit.
        </p>
        <div className="tax-coverage">
          <span>
            <b>23</b> tax years by income
          </span>
          <span>
            <b>50 + DC</b> state comparisons
          </span>
          <span>
            <b>{data.zipCount.toLocaleString("en-US")}</b> published ZIP codes
          </span>
        </div>
      </section>
      <nav className="tax-tabs" aria-label="Tax research">
        <div>
          {tabs.map(([id, label]) => (
            <a
              key={id}
              href={id === "summary" ? "/taxes" : "/taxes/" + id}
              aria-current={tab === id ? "page" : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                history.pushState(
                  {},
                  "",
                  id === "summary" ? "/taxes" : "/taxes/" + id,
                );
                setTab(id);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            >
              {label}
            </a>
          ))}
        </div>
        <a href="/data/taxes.json">
          <Download size={14} /> JSON
        </a>
      </nav>
      {tab === "summary" ? (
        <TaxSummary data={data} />
      ) : tab === "income" ? (
        <Income data={data} />
      ) : tab === "geography" ? (
        <Geography data={data} />
      ) : tab === "corporations" ? (
        corporate && <CorporateExplorer data={corporate} />
      ) : (
        <TaxSummary data={data} />
      )}
      <aside className="tax-method">
        <h2>Know what you’re counting.</h2>
        <div>
          <p>
            <b>Returns, not people.</b> A joint return can represent two
            spouses. Nonfilers are absent. Income rank is based on adjusted
            gross income, not wealth.
          </p>
          <p>
            <b>Liability, not Treasury cash receipts.</b> Tax-year IRS
            statistics and fiscal-year budget receipts have different timing and
            coverage. Do not sum or reconcile these tables as if they were one
            ledger.
          </p>
          <p>
            <b>Income tax, not all taxes.</b> Payroll, sales, property, excise
            and other taxes change the picture. Zero federal income tax does not
            mean zero taxes paid.
          </p>
        </div>
        <a href="/agents/taxes.md">
          Definitions, sources & agent query examples <ArrowUpRight size={14} />
        </a>
      </aside>
    </div>
  );
}
function Income({ data }: { data: TaxesData }) {
  const [year, setYear] = useState(2023),
    [selected, setSelected] = useState(3),
    [metric, setMetric] = useState<"taxShare" | "incomeShare" | "averageRate">(
      "taxShare",
    );
  const current = data.income.find((y) => y.year === year)!,
    band = current.bands[selected];
  return (
    <section className="tax-income">
      <div className="tax-section-heading">
        <div>
          <span className="eyebrow">01 / THE DISTRIBUTION</span>
          <h2>
            One percent of returns.
            <br />
            {pct(current.bands[3].taxShare)} of income tax.
          </h2>
          <p>
            Tax year {year} · IRS total individual income tax · excludes
            dependent returns
          </p>
        </div>
        <label>
          Tax year{" "}
          <select value={year} onChange={(e) => setYear(+e.target.value)}>
            {[...data.income].reverse().map((y) => (
              <option key={y.year}>{y.year}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="tax-controls">
        {(
          [
            ["taxShare", "Share of income tax"],
            ["incomeShare", "Share of AGI"],
            ["averageRate", "Average tax rate"],
          ] as const
        ).map(([id, label]) => (
          <button
            className={metric === id ? "active" : ""}
            aria-pressed={metric === id}
            key={id}
            onClick={() => setMetric(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="tax-distribution">
        {current.bands.map((b, i) => (
          <button
            key={b.label}
            className={selected === i ? "selected" : ""}
            onClick={() => setSelected(i)}
            aria-pressed={selected === i}
          >
            <span>{b.label}</span>
            <div className="tax-bar">
              <i style={{ width: `${Math.max(0, b[metric] ?? 0)}%` }} />
            </div>
            <strong>{b[metric] == null ? "N/A" : pct(b[metric]!)}</strong>
            <small>{b.returns.toLocaleString("en-US")} returns</small>
          </button>
        ))}
      </div>
      <div className="tax-detail-grid">
        <article className="tax-focus">
          <span className="eyebrow">SELECTED / {year}</span>
          <h3>{band.label}</h3>
          <strong>{value(band.tax)}</strong>
          <p>IRS total individual income tax</p>
          <dl>
            <div>
              <dt>Share of total AGI</dt>
              <dd>{pct(band.incomeShare)}</dd>
            </div>
            <div>
              <dt>Average income tax / AGI</dt>
              <dd>
                {band.averageRate == null ? "N/A" : pct(band.averageRate)}
              </dd>
            </div>
            <div>
              <dt>Top 1% entry AGI</dt>
              <dd>{value(current.groups.top1.floor)}</dd>
            </div>
          </dl>
          <p className="tax-note">
            Groups do not overlap. Average rates divide tax by AGI; they are not
            marginal tax brackets. Published amounts are sample estimates.
          </p>
        </article>
        <article>
          <h3>{band.label}: a 23-year view</h3>
          <p>
            {metric === "taxShare"
              ? "Share of total individual income tax"
              : metric === "incomeShare"
                ? "Share of adjusted gross income"
                : "Average income tax / AGI"}{" "}
            · 2001–2023
          </p>
          <Chart
            points={data.income.map((y) => ({
              year: y.year,
              value: y.bands[selected][metric] ?? 0,
            }))}
            label="Percent"
            percent
          />
          <input
            aria-label="Income tax year"
            type="range"
            min="2001"
            max="2023"
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          />
          <div className="tax-range-labels">
            <span>2001</span>
            <b>{year}</b>
            <span>2023</span>
          </div>
        </article>
      </div>
      <details className="tax-exact">
        <summary>Exact annual observations for {band.label}</summary>
        <div className="tax-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Tax year</th>
                <th scope="col">Income tax (USD)</th>
                <th scope="col">Share of income tax</th>
                <th scope="col">Share of AGI</th>
                <th scope="col">Average tax / AGI</th>
              </tr>
            </thead>
            <tbody>
              {data.income.map((y) => (
                <tr key={y.year}>
                  <th scope="row">{y.year}</th>
                  <td>{y.bands[selected].tax.toLocaleString("en-US")}</td>
                  <td>{pct(y.bands[selected].taxShare)}</td>
                  <td>{pct(y.bands[selected].incomeShare)}</td>
                  <td>{pct(y.bands[selected].averageRate ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="tax-source">
        Source:{" "}
        <a href={data.sources["shares.xlsx"].url}>
          IRS Table 4.1, tax years 2001–2023
        </a>{" "}
        · Published March 2026. {data.limitations.income}
      </p>
    </section>
  );
}
function Geography({ data }: { data: TaxesData }) {
  const [state, setState] = useState("CA"),
    [band, setBand] = useState(0),
    [metric, setMetric] = useState<
      "incomeTax" | "totalLiability" | "agi" | "returns"
    >("incomeTax"),
    [zip, setZip] = useState(""),
    [zipRows, setZipRows] = useState<
      (Values & { band: number; state: string })[] | null
    >(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const states = [...new Set(data.states.map((s) => s.state))].filter(
    (s) => !["US", "OA", "PR"].includes(s),
  );
  const sorted = data.states
    .filter((r) => states.includes(r.state) && r.band === band)
    .sort((a, b) => (b[metric] ?? -Infinity) - (a[metric] ?? -Infinity));
  const chosen = data.states.find((r) => r.state === state && r.band === band);
  async function findZip() {
    setBusy(true);
    setMessage("");
    setZipRows(null);
    try {
      const result = await fetch(
        "/api/v1/taxes?dataset=geography&zip=" + encodeURIComponent(zip),
      ).then(readJSON<{ rows: (Values & { band: number; state: string })[] }>);
      setZipRows(result.rows);
      if (!result.rows.length)
        setMessage(
          "No published ZIP record. Small or nonresidential ZIP codes may be combined or suppressed.",
        );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to load ZIP data.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="tax-section-heading">
        <div>
          <span className="eyebrow">02 / THE GEOGRAPHY</span>
          <h2>
            Where returns are filed.
            <br />
            Where income is reported.
          </h2>
          <p>
            Federal individual taxes by filing address. These are not
            state-government tax collections.
          </p>
        </div>
        <span className="tax-vintage">
          States: 2023
          <br />
          ZIP codes: 2022
        </span>
      </div>
      <div className="tax-geo-controls">
        <label>
          Income class (AGI)
          <select value={band} onChange={(e) => setBand(+e.target.value)}>
            {data.stateBands.map((b, i) => (
              <option key={b} value={i}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label>
          Compare
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
          >
            <option value="incomeTax">Income tax after credits</option>
            <option value="totalLiability">Total return tax liability</option>
            <option value="agi">Adjusted gross income</option>
            <option value="returns">Number of returns</option>
          </select>
        </label>
        <label>
          Selected state
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="tax-detail-grid">
        <div className="tax-state-list" aria-label="State comparison">
          {sorted.map((r, i) => (
            <button
              key={r.state}
              className={state === r.state ? "selected" : ""}
              onClick={() => setState(r.state)}
            >
              <small>{String(i + 1).padStart(2, "0")}</small>
              <b>{r.state}</b>
              <span className="tax-bar">
                <i
                  style={{
                    width: `${Math.max(0, ((r[metric] ?? 0) / (sorted[0]?.[metric] || 1)) * 100)}%`,
                  }}
                />
              </span>
              <strong>
                {metric === "returns"
                  ? r.returns?.toLocaleString("en-US")
                  : value(r[metric])}
              </strong>
            </button>
          ))}
        </div>
        <article className="tax-focus">
          <span className="eyebrow">{state} / TAX YEAR 2023</span>
          <h3>{data.stateBands[band]}</h3>
          <strong>{value(chosen?.incomeTax)}</strong>
          <p>Federal income tax after credits</p>
          <dl>
            <div>
              <dt>Returns</dt>
              <dd>{chosen?.returns?.toLocaleString("en-US")}</dd>
            </div>
            <div>
              <dt>Adjusted gross income</dt>
              <dd>{value(chosen?.agi)}</dd>
            </div>
            <div>
              <dt>Total return tax liability</dt>
              <dd>{value(chosen?.totalLiability)}</dd>
            </div>
          </dl>
          <p className="tax-note">
            Total return liability includes additional taxes reported on Form
            1040. It still excludes many taxes, including sales and property
            taxes. State totals are not adjusted for population.
          </p>
          <a href={"/awards?state=" + state}>
            Explore federal awards in {state} ↗
          </a>
        </article>
      </div>
      <article className="tax-zip">
        <div>
          <span className="eyebrow">ZOOM IN / 2022</span>
          <h3>Look up a ZIP code.</h3>
          <p>Six income classes. Published aggregate returns only.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void findZip();
          }}
        >
          <label htmlFor="tax-zip">Five-digit ZIP code</label>
          <div>
            <input
              id="tax-zip"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              required
              placeholder="02139"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />
            <button className="btn" disabled={busy}>
              <Search size={15} />
              {busy ? "Loading…" : "Look up"}
            </button>
          </div>
        </form>
        {message && <p role="status">{message}</p>}
        {zipRows && zipRows.length > 0 && (
          <div className="tax-table-wrap">
            <table>
              <caption>
                {zipRows[0].state} · ZIP {zip} · tax year 2022 · published cells
              </caption>
              <thead>
                <tr>
                  <th scope="col">AGI class</th>
                  <th scope="col">Returns</th>
                  <th scope="col">AGI</th>
                  <th scope="col">Income tax after credits</th>
                </tr>
              </thead>
              <tbody>
                {zipRows.map((r) => (
                  <tr key={r.band}>
                    <th scope="row">{data.zipBands[r.band]}</th>
                    <td>
                      {r.returns?.toLocaleString("en-US") ?? "Unavailable"}
                    </td>
                    <td>{value(r.agi)}</td>
                    <td>{value(r.incomeTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="tax-note">{data.limitations.zip}</p>
      </article>
      <p className="tax-source">
        Sources:{" "}
        <a href={data.sources["states.csv"].url}>IRS 2023 Historic Table 2</a> ·{" "}
        <a href="https://www.irs.gov/statistics/soi-tax-stats-individual-income-tax-statistics-2022-zip-code-data-soi">
          IRS 2022 ZIP statistics & disclosure rules
        </a>
        . {data.limitations.geography}
      </p>
    </section>
  );
}
function TaxSummary({ data }: { data: TaxesData }) {
  return (
    <section className="tax-summary">
      <span className="eyebrow">START WITH THE RIGHT QUESTION</span>
      <h2>
        One tax system.
        <br />
        Several different windows.
      </h2>
      <p className="tax-lede">
        The answer to “who pays?” depends on which tax, which year, and which
        measure you mean.
      </p>
      <div className="tax-summary-grid">
        {[
          {
            href: "income",
            title: "By income",
            number: "38.4%",
            text: "The top 1% share of IRS total individual income tax in 2023. Explore four nonoverlapping groups and 23 years.",
          },
          {
            href: "geography",
            title: "By place",
            number: data.zipCount.toLocaleString("en-US"),
            text: "Published ZIP codes in the 2022 extract, plus 2023 state returns split into ten income classes.",
          },
          {
            href: "corporations",
            title: "By company",
            number: "Cash ≠ expense",
            text: "Open selected public reports. See what federal cash disclosures reveal—and where only global or accounting measures are available.",
          },
        ].map((c) => (
          <a href={"/taxes/" + c.href} key={c.href}>
            <small>{c.title} ↗</small>
            <strong>{c.number}</strong>
            <p>{c.text}</p>
          </a>
        ))}
      </div>
      <p className="tax-prose">
        For the full revenue mix, start with{" "}
        <a href="/budget?tab=revenue">federal receipts by tax source</a>. Then
        use these narrower datasets to investigate the people, places and
        companies behind specific taxes. This release does not measure total tax
        incidence across income groups.
      </p>
    </section>
  );
}
