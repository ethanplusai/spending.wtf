import { useSnapshot } from "../environment";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Search,
  Download,
  Globe2,
  ChevronDown,
} from "lucide-react";
import {
  money,
  download,
  stateCodes,
  sources,
  readJSON,
  kindLabels,
} from "../data";
import type { Data, Snapshot, StateRow, Page, AwardKind } from "../data";
import Chart from "../Chart";
import Metric from "../components/Metric";

const portals = [
  {
    name: "Open Book New York",
    jurisdiction: "New York State",
    type: "State",
    url: "https://www.osc.ny.gov/open-book-new-york",
    text: "State contracts, payments, public authorities, and local government financial reports.",
    status: "Source directory",
  },
  {
    name: "Checkbook NYC",
    jurisdiction: "New York City",
    type: "Local",
    url: "https://www.checkbooknyc.com/",
    text: "City spending, contracts, budgets, revenue, and payroll. A promising first municipal integration.",
    status: "Source directory",
  },
  {
    name: "Texas Comptroller",
    jurisdiction: "Texas",
    type: "State",
    url: "https://comptroller.texas.gov/transparency/",
    text: "State spending and local financial transparency resources, with jurisdiction-specific reporting.",
    status: "Source directory",
  },
  {
    name: "California Open Data",
    jurisdiction: "California",
    type: "State",
    url: "https://data.ca.gov/",
    text: "A catalog of agency datasets. Coverage and update cadence must be checked per dataset.",
    status: "Source directory",
  },
  {
    name: "Census Government Finances",
    jurisdiction: "Nationwide",
    type: "National",
    url: "https://www.census.gov/programs-surveys/gov-finances.html",
    text: "Comparable annual revenue, expenditure, and debt statistics for state and local governments.",
    status: "Aggregate statistics",
  },
];
function Places({
  go,
  data,
}: {
  go: (p: Page, extra?: Record<string, string>) => void;
  data: Data;
}) {
  const [rows, setRows] = useState<StateRow[]>(
      useSnapshot<{ data: StateRow[] }>("explore-all-states")?.data ?? [],
    ),
    [awardKind, setAwardKind] = useState<AwardKind>("all"),
    [selected, setSelected] = useState("CA"),
    [mode, setMode] = useState("Total obligations"),
    [query, setQuery] = useState(""),
    [type, setType] = useState("All"),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/data/explore-${awardKind}-states.json`, {
      signal: controller.signal,
    })
      .then(readJSON<Snapshot<StateRow[]>>)
      .then((j: Snapshot<StateRow[]>) =>
        setRows(j.data.filter((r) => stateCodes.includes(r.shape_code))),
      )
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("Geography data could not be loaded.");
      });
    return () => controller.abort();
  }, [awardKind]);
  const sorted = rows
      .filter((r) =>
        `${r.display_name} ${r.shape_code}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .sort((a, b) =>
        mode === "Per resident"
          ? b.per_capita - a.per_capita
          : b.aggregated_amount - a.aggregated_amount,
      ),
    s = rows.find((r) => r.shape_code === selected);
  const max = Math.max(
    ...sorted.map((r) =>
      mode === "Per resident" ? r.per_capita : r.aggregated_amount,
    ),
    1,
  );
  return (
    <section className="section subpage">
      <div className="page-intro">
        <span className="eyebrow">THE MONEY, CLOSER TO HOME</span>
        <h1>
          One nation.
          <br />
          Thousands of ledgers.
        </h1>
        <p>
          Explore federal contracts, grants, and direct payments where the work
          happens. Then go deeper into the state and local records that tell the
          rest of the story.
        </p>
      </div>
      <div className="notice">
        <Globe2 size={18} />
        <span>
          <b>Federal money in a state is not that state’s budget.</b> The chart
          below shows federal award obligations by place of performance in FY
          2025. State and local sources are listed separately.
        </span>
      </div>
      <div className="award-kind-tabs" aria-label="State award type">
        {(["all", "contracts", "grants", "direct"] as AwardKind[]).map((k) => (
          <button
            key={k}
            className={awardKind === k ? "active" : ""}
            aria-pressed={awardKind === k}
            onClick={() => {
              setRows([]);
              setError("");
              setAwardKind(k);
            }}
          >
            {kindLabels[k]}
          </button>
        ))}
      </div>
      <div className="places-layout">
        <div className="state-ranking">
          <div className="panel-heading">
            <h3>Federal awards, by state.</h3>
            <div className="segmented">
              {["Total obligations", "Per resident"].map((m) => (
                <button
                  key={m}
                  className={mode === m ? "selected" : ""}
                  onClick={() => setMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="search-small">
            <Search size={16} />
            <input
              aria-label="Find a state"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find your state…"
            />
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="state-list">
            {sorted.map((r, i) => (
              <button
                key={r.shape_code}
                className={
                  selected === r.shape_code ? "state-row active" : "state-row"
                }
                onClick={() => setSelected(r.shape_code)}
              >
                <span className="rank">{i + 1}</span>
                <span className="state-code">{r.shape_code}</span>
                <span className="state-label">
                  {r.display_name}
                  <i
                    style={{
                      width: `${((mode === "Per resident" ? r.per_capita : r.aggregated_amount) / max) * 100}%`,
                    }}
                  />
                </span>
                <b>
                  {money(
                    mode === "Per resident"
                      ? r.per_capita
                      : r.aggregated_amount,
                    1,
                  )}
                </b>
                <ArrowUpRight size={13} />
              </button>
            ))}
            {!sorted.length && !error && (
              <p className="empty">No matching states.</p>
            )}
          </div>
        </div>
        <aside className="state-detail">
          <span className="eyebrow">PLACE OF PERFORMANCE / FY 2025</span>
          <div className="state-monogram">{selected}</div>
          <h2>{s?.display_name ?? "Loading…"}</h2>
          <span className="muted">{kindLabels[awardKind]} obligations</span>
          <strong>{s ? money(s.aggregated_amount) : "—"}</strong>
          <dl>
            <dt>Per resident</dt>
            <dd>{s ? money(s.per_capita) : "—"}</dd>
            <dt>Source population</dt>
            <dd>{s?.population?.toLocaleString() ?? "—"}</dd>
            <dt>Measure</dt>
            <dd>Net obligations in period</dd>
          </dl>
          <p>
            Location reflects the reported place of performance, which may
            differ from the recipient’s headquarters. Population is supplied by
            USAspending; its vintage may differ from FY 2025.
          </p>
          <button
            className="btn dark"
            onClick={() =>
              go("contracts", { state: selected, kind: awardKind })
            }
          >
            Explore{" "}
            {awardKind === "all"
              ? "awards"
              : awardKind === "direct"
                ? "payments"
                : awardKind}{" "}
            in {selected} <ArrowUpRight size={15} />
          </button>
          <button
            className="text-link"
            onClick={() =>
              download(
                `federal-${awardKind}-by-state.csv`,
                sorted.map((r) => ({
                  ...r,
                  fiscal_year: 2025,
                  source: sources.usa,
                })),
              )
            }
          >
            <Download size={14} /> Download state data
          </button>
        </aside>
      </div>
      <NationalExpenditure data={data} />
      <div className="section-heading directory-heading">
        <div>
          <span className="eyebrow">BEYOND THE FEDERAL LEDGER</span>
          <h2>Find the next public record.</h2>
        </div>
        <div className="segmented">
          {["All", "State", "Local", "National"].map((t) => (
            <button
              key={t}
              className={type === t ? "selected" : ""}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <p className="directory-note">
        A researched source directory, not yet a unified state/local database.
        Each jurisdiction has its own definitions, identifiers, and publication
        schedule.
      </p>
      <div className="portal-grid">
        {portals
          .filter((p) => type === "All" || p.type === type)
          .map((p) => (
            <a
              className="portal-card"
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="eyebrow">
                {p.type.toUpperCase()} / {p.jurisdiction}
              </span>
              <h3>
                {p.name}
                <ArrowUpRight size={18} />
              </h3>
              <p>{p.text}</p>
              <span className="status-pill">{p.status}</span>
            </a>
          ))}
      </div>
      <div className="research-guide">
        <span className="eyebrow">THE PATH TO A CONNECTED LEDGER</span>
        <h3>Better aggregation starts with better accounting.</h3>
        <div className="three-col">
          <div>
            <b>01 / Comparable totals</b>
            <p>
              Use Census government finance statistics for consistent
              cross-state comparisons. Preserve the reporting year, government
              level, and accounting basis.
            </p>
          </div>
          <div>
            <b>02 / Local transactions</b>
            <p>
              Integrate selected comptroller and municipal feeds with
              source-specific adapters. Preserve contract IDs, modifications,
              vendor identifiers, and data coverage.
            </p>
          </div>
          <div>
            <b>03 / Trace transfers</b>
            <p>
              Link federal grants to pass-through entities before joining local
              expenditures. Never add a federal transfer and its subsequent
              local expenditure as two independent dollars.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
function NationalExpenditure({ data }: { data: Data }) {
  const [year, setYear] = useState(2025),
    [from, setFrom] = useState(1960),
    [table, setTable] = useState(false);
  const selected = data.governmentExpenditures.find((x) => x.year === year)!;
  const points = data.governmentExpenditures
    .filter((x) => x.year >= from && x.year <= year)
    .map((x) => ({
      year: x.year,
      value: x.federal,
      second: x.stateLocalOwnSource,
    }));
  return (
    <section className="national-expenditure">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE CONNECTED NATIONAL PICTURE</span>
          <h2>Beyond Washington.</h2>
        </div>
        <label className="select-wrap">
          <span>Year</span>
          <select
            aria-label="Government expenditures year"
            value={year}
            onChange={(e) => {
              setYear(+e.target.value);
              if (from > +e.target.value) setFrom(+e.target.value);
            }}
          >
            {data.governmentExpenditures
              .slice()
              .reverse()
              .map((x) => (
                <option key={x.year}>{x.year}</option>
              ))}
          </select>
          <ChevronDown size={14} />
        </label>
      </div>
      <p className="directory-note">
        A nationwide view of federal outlays and state/local expenditures
        financed from their own sources. Federal grants are an addendum, already
        represented in federal outlays—not extra spending to add again.
      </p>
      <div className="metrics local-metrics">
        <Metric
          label="Federal outlays"
          value={money(selected.federal)}
          note={`FY ${year} · OMB Table 14.2`}
        />
        <Metric
          label="State & local, own sources"
          value={money(selected.stateLocalOwnSource)}
          note="Nationwide aggregate · NIPA basis"
        />
        <Metric
          label="Federal grants (addendum)"
          value={money(selected.grants)}
          note="Transfers · not additive to the other totals"
        />
      </div>
      <div className="chart-panel">
        <div className="panel-heading">
          <div>
            <h3>Two levels of government. One public.</h3>
            <p>
              Nominal dollars · {points[0]?.year}–{year}
            </p>
          </div>
          <div className="chart-tools">
            <label className="year-inputs">
              From{" "}
              <input
                aria-label="Government expenditures start year"
                type="number"
                min="1948"
                max={year}
                value={from}
                onChange={(e) =>
                  setFrom(Math.max(1948, Math.min(year, +e.target.value)))
                }
              />
            </label>
            <button
              className="icon-btn"
              aria-label="Download government expenditures"
              onClick={() =>
                download(
                  "government-expenditures.csv",
                  data.governmentExpenditures
                    .filter((x) => x.year >= from && x.year <= year)
                    .map((x) => ({
                      ...x,
                      units: "USD",
                      source: "OMB FY 2027 Historical Table 14.2",
                      note: "State/local own sources on NIPA basis, net of interest receipts; federal grants are non-additive",
                    })),
                )
              }
            >
              <Download size={15} />
            </button>
          </div>
        </div>
        <Chart
          points={points}
          label="Federal outlays"
          secondLabel="State & local, own sources"
        />
        <div className="panel-foot">
          <a
            href="https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/"
            target="_blank"
            rel="noreferrer"
          >
            OMB Table 14.2 · FY 2027 vintage ↗
          </a>
          <button className="text-link" onClick={() => setTable(!table)}>
            {table ? "Hide" : "View"} expenditure data <ChevronDown size={12} />
          </button>
        </div>
        {table && (
          <div className="table-scroll history-data">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Federal</th>
                  <th>State/local own sources</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.year}>
                    <td>{p.year}</td>
                    <td>{money(p.value)}</td>
                    <td>{money(p.second)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Places;
