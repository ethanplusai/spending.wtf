import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
import type { Data, Page } from "../data";
import { money } from "../data";
export default function DebtExperience({
  data,
  go,
}: {
  data: Data;
  go: (page: Page) => void;
}) {
  const rows = data.debtHistory.filter((r) => r.year >= 1971),
    [year, setYear] = useState(2025),
    [playing, setPlaying] = useState(false),
    [seconds, setSeconds] = useState(60);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setYear((y) => {
          if (y >= 2025) {
            setPlaying(false);
            return 2025;
          }
          return y + 1;
        }),
      180,
    );
    return () => clearInterval(t);
  }, [playing]);
  const debt = rows.find((r) => r.year === year)!.debt,
    base = rows[0].debt,
    budget = data.historicalBudget.find((r) => r.year === year)!,
    spending = (budget.spending * seconds) / (365 * 86400),
    revenue = (budget.revenue * seconds) / (365 * 86400),
    deficit = spending - revenue,
    share = (budget.revenue / budget.spending) * 100;
  return (
    <section className="debt-experience">
      <div className="experience-label">
        <span>
          <i /> THE UNITED STATES / AN OPEN FINANCIAL RECORD
        </span>
        <a href="/agents/README.md">
          Built for humans. Open to agents. <ArrowUpRight size={13} />
        </a>
      </div>
      <div className="debt-head">
        <div>
          <h1>America, this is the bill.</h1>
          <p>
            Move through time. Watch the debt grow.
            <br />
            Then follow the money behind it.
          </p>
        </div>
        <button onClick={() => go("contracts")} className="btn dark">
          Investigate the spending <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="debt-readout">
        <div>
          <span className="eyebrow">
            GROSS FEDERAL DEBT · FISCAL YEAR {year}
          </span>
          <strong aria-live="off">
            {money(debt)}
            <span> USD</span>
          </strong>
        </div>
        <div className="debt-multiplier">
          <b>{(debt / base).toFixed(1)}×</b>
          <span>the nominal debt in 1971</span>
          <button onClick={() => go("history")}>
            Adjust for inflation & GDP <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
      <div
        className="debt-bars"
        role="group"
        aria-label="Select a fiscal year to inspect national debt"
      >
        {rows.map((r, i) => (
          <button
            key={r.year}
            aria-label={`Debt in ${r.year}: ${money(r.debt)}`}
            aria-pressed={r.year === year}
            className={r.year <= year ? "illuminated" : ""}
            style={{
              animationDelay: `${280 + i * 9}ms`,
              height: `${Math.max(3, (r.debt / rows.at(-1)!.debt) * 100)}%`,
            }}
            onPointerEnter={(e) => {
              if (e.buttons === 1) {
                setPlaying(false);
                setYear(r.year);
              }
            }}
            onClick={() => {
              setPlaying(false);
              setYear(r.year);
            }}
          >
            <span>
              {r.year}
              <b>{money(r.debt)}</b>
            </span>
          </button>
        ))}
      </div>
      <div className="timeline-control">
        <button
          className="play-control"
          aria-label={playing ? "Pause debt timeline" : "Play debt timeline"}
          onClick={() => {
            if (year === 2025) setYear(1971);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <span>1971</span>
        <input
          type="range"
          min="1971"
          max="2025"
          value={year}
          aria-label="Scrub national debt year"
          onChange={(e) => {
            setPlaying(false);
            setYear(+e.target.value);
          }}
        />
        <output>{year}</output>
        <span>2025</span>
      </div>
      <div className="experience-source">
        <span>
          Drag to explore ↑ · Annual Treasury observations, not a live debt
          clock.
        </span>
        <a href="https://fiscaldata.treasury.gov/datasets/historical-debt-outstanding/">
          View source ↗
        </a>
      </div>
      <div className="spending-experiment">
        <div>
          <span className="eyebrow">MAKE THE SCALE REAL</span>
          <h2>
            What happens in
            <br />
            <em>
              {seconds === 1
                ? "one second"
                : seconds === 60
                  ? "one minute"
                  : seconds === 3600
                    ? "one hour"
                    : seconds === 86400
                      ? "one day"
                      : `${seconds.toLocaleString()} seconds`}
              ?
            </em>
          </h2>
          <div className="time-presets">
            {[
              [1, "Second"],
              [60, "Minute"],
              [3600, "Hour"],
              [86400, "Day"],
            ].map(([n, label]) => (
              <button
                key={n}
                aria-pressed={seconds === n}
                className={seconds === n ? "selected" : ""}
                onClick={() => setSeconds(Number(n))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="spending-equation">
          <div>
            <span>SPENT</span>
            <strong>{money(spending)}</strong>
          </div>
          <span className="equation-sign">−</span>
          <div>
            <span>COLLECTED</span>
            <strong>{money(revenue)}</strong>
          </div>
          <span className="equation-sign">=</span>
          <div className="shortfall">
            <span>{deficit >= 0 ? "THE SHORTFALL" : "THE SURPLUS"}</span>
            <strong>{money(Math.abs(deficit))}</strong>
          </div>
          <div className="funding-meter">
            <span style={{ width: `${Math.min(100, share)}%` }} />
          </div>
          <p>
            FY {year} annual totals, divided into a 365-day illustration. Actual
            spending is uneven.{" "}
            {deficit >= 0
              ? `${(100 - share).toFixed(1)}% of spending exceeded receipts.`
              : "Receipts exceeded spending."}
          </p>
        </div>
      </div>
      <a className="experience-next" href="#national-picture">
        Go deeper into the numbers <ArrowDown size={15} />
      </a>
    </section>
  );
}
