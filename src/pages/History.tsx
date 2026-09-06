import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Download,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { money, download, sources } from "../data";
import type { Data } from "../data";
import Chart from "../Chart";

function History({ data }: { data: Data }) {
  const [from, setFrom] = useState(1960),
    [to, setTo] = useState(2025),
    [series, setSeries] = useState("Gross debt"),
    [measure, setMeasure] = useState("Nominal dollars"),
    [table, setTable] = useState(false),
    [amount, setAmount] = useState(100),
    [base, setBase] = useState(1971),
    [target, setTarget] = useState(data.cpi.at(-1)!.year),
    [context, setContext] = useState<Record<string, Record<number, number>>>(
      {},
    );
  useEffect(() => {
    Promise.all(
      ["gdp", "population"].map(async (name) => {
        const j = await fetch(`/data/${name}.json`).then((r) => r.json());
        return [
          name,
          Object.fromEntries(
            j[1]
              .filter((r: { value: number | null }) => r.value !== null)
              .map((r: { date: string; value: number }) => [
                Number(r.date),
                r.value,
              ]),
          ),
        ];
      }),
    )
      .then((entries) => setContext(Object.fromEntries(entries)))
      .catch(() => {});
  }, []);
  const cp = (y: number) => data.cpi.find((x) => x.year === y)?.value;
  const latestCpi = data.cpi.at(-1)!,
    ratio = (cp(target) ?? 1) / (cp(base) ?? 1);
  const rawPoints =
    series === "Gross debt"
      ? data.debtHistory.map((x) => ({
          year: x.year,
          value: x.debt,
          second: undefined as number | undefined,
        }))
      : data.historicalBudget.map((x) => ({
          year: x.year,
          value: x.spending,
          second: x.revenue,
        }));
  const points = rawPoints
    .filter((x) => x.year >= from && x.year <= to)
    .filter((x) =>
      measure === "Share of GDP"
        ? !!context.gdp?.[x.year]
        : measure === "Per person"
          ? !!context.population?.[x.year]
          : measure === "Inflation adjusted"
            ? !!cp(x.year)
            : true,
    )
    .map((x) => {
      const scale =
        measure === "Share of GDP"
          ? 100 / context.gdp[x.year]
          : measure === "Per person"
            ? 1 / context.population[x.year]
            : measure === "Inflation adjusted"
              ? latestCpi.value / (cp(x.year) ?? 1)
              : 1;
      return {
        year: x.year,
        value: x.value * scale,
        ...(x.second !== undefined ? { second: x.second * scale } : {}),
      };
    });
  const latestPrice = data.cpiMonthly.at(-1)!,
    priorPrice = data.cpiMonthly.find(
      (x) => x.year === latestPrice.year - 1 && x.month === latestPrice.month,
    );
  const first = points[0],
    last = points.at(-1);
  const unit =
    measure === "Share of GDP"
      ? "% OF CALENDAR-YEAR GDP"
      : measure === "Per person"
        ? "NOMINAL DOLLARS PER PERSON"
        : measure === "Inflation adjusted"
          ? `${latestCpi.year} DOLLARS · CALENDAR-YEAR CPI`
          : "NOMINAL DOLLARS";
  const events = [
    {
      year: 1933,
      title: "Domestic gold redemption ends",
      text: "The U.S. suspended domestic gold payments and restricted monetary gold ownership. The transition away from gold happened in stages.",
      url: "https://www.federalreservehistory.org/essays/roosevelts-gold-program",
    },
    {
      year: 1944,
      title: "Bretton Woods",
      text: "A new international monetary arrangement linked currencies to the dollar, with official dollar convertibility into gold.",
      url: "https://www.federalreservehistory.org/essays/bretton-woods-created",
    },
    {
      year: 1971,
      title: "The gold window closes",
      text: "On August 15, President Nixon suspended dollar-to-gold convertibility for foreign monetary authorities. The decision changed the international system.",
      url: sources.history,
    },
    {
      year: 2008,
      title: "The financial crisis",
      text: "Recession, lower tax receipts, and fiscal responses affected the budget. Debt also reflects the gap between spending and revenue.",
      url: "https://www.federalreservehistory.org/essays/great-recession-of-200709",
    },
    {
      year: 2020,
      title: "The pandemic response",
      text: "Emergency spending and economic disruption produced a sharp jump in federal borrowing. Compare the nominal, real, and GDP-relative views.",
      url: "https://fiscaldata.treasury.gov/americas-finance-guide/national-deficit/",
    },
  ];
  return (
    <section className="section subpage">
      <div className="page-intro">
        <span className="eyebrow">DEBT, PRICES & PURCHASING POWER</span>
        <h1>The long view.</h1>
        <p>
          What changed. What grew. What a dollar buys.
          <br />
          Explore the numbers across generations, with the context they deserve.
        </p>
      </div>
      <div className="history-banner">
        <span>1971</span>
        <div>
          <h3>A turning point. Not a complete explanation.</h3>
          <p>
            Ending gold convertibility changed monetary policy constraints. Debt
            and inflation also reflect wars, recessions, demographics, tax
            policy, interest rates, and fiscal choices. A before-and-after chart
            cannot isolate causation.
          </p>
          <a href={sources.history} target="_blank" rel="noreferrer">
            Read the Federal Reserve’s history <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      <div className="chart-panel history-chart">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">
              {series.toUpperCase()} / {from}–{to}
            </span>
            <h3>Put the scale in perspective.</h3>
          </div>
          <button
            className="icon-btn"
            aria-label="Download debt history"
            onClick={() =>
              download(
                "debt-history.csv",
                points.map((p) => ({
                  ...p,
                  measure,
                  unit,
                  series,
                  source:
                    series === "Gross debt"
                      ? sources.treasury
                      : "https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/",
                })),
              )
            }
          >
            <Download size={17} />
          </button>
        </div>
        <div className="series-selector">
          <label>
            Explore
            <select
              aria-label="Historical series"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
            >
              <option>Gross debt</option>
              <option>Spending & revenue</option>
            </select>
          </label>
          <span>
            {series === "Gross debt"
              ? "Treasury · 1790–2025"
              : "OMB Table 1.1 · 1901–2025"}
          </span>
        </div>
        <div className="history-controls">
          <div className="segmented">
            {[
              "Nominal dollars",
              "Inflation adjusted",
              "Share of GDP",
              "Per person",
            ].map((m) => (
              <button
                key={m}
                className={m === measure ? "selected" : ""}
                onClick={() => setMeasure(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="year-inputs">
            <label>
              From
              <input
                aria-label="History start year"
                type="number"
                min="1790"
                max={to - 1}
                value={from}
                onChange={(e) =>
                  setFrom(Math.max(1790, Math.min(to - 1, +e.target.value)))
                }
              />
            </label>
            <span>—</span>
            <label>
              To
              <input
                aria-label="History end year"
                type="number"
                min={from + 1}
                max="2025"
                value={to}
                onChange={(e) =>
                  setTo(Math.min(2025, Math.max(from + 1, +e.target.value)))
                }
              />
            </label>
          </div>
        </div>
        <div className="history-stats">
          <div>
            <span>{first?.year ?? "—"}</span>
            <b>
              {first
                ? measure === "Share of GDP"
                  ? first.value.toFixed(1) + "%"
                  : money(first.value)
                : "—"}
            </b>
          </div>
          <ArrowRight size={25} />
          <div>
            <span>{last?.year ?? "—"}</span>
            <b>
              {last
                ? measure === "Share of GDP"
                  ? last.value.toFixed(1) + "%"
                  : money(last.value)
                : "—"}
            </b>
          </div>
          <span className="unit-label">{unit}</span>
        </div>
        <Chart
          points={points}
          label={series === "Gross debt" ? "Gross debt" : "Spending"}
          percent={measure === "Share of GDP"}
          marker
        />
        <div className="range-slider">
          <span>1790</span>
          <input
            aria-label="Historical period start slider"
            type="range"
            min="1790"
            max={to - 1}
            value={from}
            onChange={(e) => setFrom(+e.target.value)}
          />
          <span>{to}</span>
        </div>
        <div className="panel-foot">
          <span>
            {series === "Gross debt"
              ? "Fiscal-year-end gross debt."
              : "OMB annual outlays and receipts; 1976 transition quarter excluded. Revisions can differ from the Treasury overview."}{" "}
            {measure === "Share of GDP"
              ? "GDP uses the same calendar year; this is a contextual ratio, not an official fiscal-year GDP ratio."
              : measure === "Inflation adjusted"
                ? "CPI-U annual averages; coverage starts in 1960."
                : measure === "Per person"
                  ? "Calendar-year population; coverage starts in 1960."
                  : "Fiscal year-end moved from June to September in 1976."}
          </span>
          <button className="text-link" onClick={() => setTable(!table)}>
            {table ? "Hide" : "View"} data <ChevronDown size={12} />
          </button>
        </div>
        {table && (
          <div className="table-scroll history-data">
            <table>
              <thead>
                <tr>
                  <th>Fiscal year</th>
                  <th>
                    {series === "Gross debt" ? "Debt" : "Spending"} · {measure}
                  </th>
                  {series !== "Gross debt" && <th>Revenue</th>}
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.year}>
                    <td>{p.year}</td>
                    <td>
                      {measure === "Share of GDP"
                        ? p.value.toFixed(2) + "%"
                        : money(p.value)}
                    </td>
                    {p.second !== undefined && (
                      <td>
                        {measure === "Share of GDP"
                          ? p.second.toFixed(2) + "%"
                          : money(p.second)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="inflation-latest">
        <div>
          <span className="eyebrow">LATEST PRICE OBSERVATION</span>
          <h3>Inflation is a rate. Prices are a level.</h3>
          <p>
            Slower inflation means prices rise more slowly; it does not mean
            prices have fallen.
          </p>
        </div>
        <div>
          <strong>
            {priorPrice
              ? ((latestPrice.value / priorPrice.value - 1) * 100).toFixed(1) +
                "%"
              : "—"}
          </strong>
          <span>Year-over-year CPI-U · {latestPrice.date}</span>
        </div>
        <div>
          <strong>{latestPrice.value.toFixed(3)}</strong>
          <span>Consumer price index · 1982–84 = 100</span>
        </div>
      </div>
      <div className="purchasing">
        <div>
          <span className="eyebrow">THE DOLLAR IN YOUR POCKET</span>
          <h2>
            Same dollar.
            <br />
            Different buying power.
          </h2>
          <p>
            Compare the cost of the same average basket of consumer goods and
            services. This measures domestic purchasing power, not a
            foreign-exchange rate.
          </p>
          <a href={sources.bls} target="_blank" rel="noreferrer">
            Bureau of Labor Statistics · CPI-U <ArrowUpRight size={13} />
          </a>
        </div>
        <div className="calculator">
          <div className="calculator-inputs">
            <label>
              Amount ($)
              <input
                type="number"
                min="0"
                max="1000000000"
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(0, Math.min(1e9, +e.target.value)))
                }
              />
            </label>
            <label>
              In
              <select
                aria-label="Purchasing power original year"
                value={base}
                onChange={(e) => setBase(+e.target.value)}
              >
                {data.cpi.map((y) => (
                  <option key={y.year}>{y.year}</option>
                ))}
              </select>
            </label>
            <ArrowRight size={17} />
            <label>
              In
              <select
                aria-label="Purchasing power target year"
                value={target}
                onChange={(e) => setTarget(+e.target.value)}
              >
                {data.cpi.map((y) => (
                  <option key={y.year}>{y.year}</option>
                ))}
              </select>
            </label>
          </div>
          <span className="eyebrow">YOU WOULD NEED APPROXIMATELY</span>
          <strong>
            {(amount * ratio).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </strong>
          <p>
            in {target} to match ${amount.toLocaleString()} in {base}.
          </p>
          <div className="purchasing-bar">
            <div style={{ width: `${Math.min(100, 100 / ratio)}%` }} />
          </div>
          <small>
            {ratio >= 1
              ? `${(100 - 100 / ratio).toFixed(1)}% less purchasing power per dollar`
              : `${((1 / ratio - 1) * 100).toFixed(1)}% more purchasing power per dollar`}{" "}
            · annual CPI averages
          </small>
          <details>
            <summary>Show the calculation</summary>
            <p>
              ${amount} × ({cp(target)?.toFixed(3)} ÷ {cp(base)?.toFixed(3)}) =
              ${(amount * ratio).toFixed(2)}. Uses only complete years with 12
              monthly observations. The source has no October 2025 observation,
              so 2025 is excluded.
            </p>
          </details>
        </div>
      </div>
      <div className="section-heading timeline-heading">
        <div>
          <span className="eyebrow">CONTEXT CHANGES THE PICTURE</span>
          <h2>A timeline worth understanding.</h2>
        </div>
      </div>
      <div className="timeline">
        {events.map((e) => (
          <article key={e.year}>
            <button
              onClick={() => {
                setFrom(Math.max(1790, e.year - 10));
                setTo(Math.min(2025, e.year + 20));
                document
                  .querySelector(".history-chart")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {e.year}
              <ArrowUpRight size={18} />
            </button>
            <div>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
              <a href={e.url} target="_blank" rel="noreferrer">
                Read the source <ExternalLink size={12} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default History;
