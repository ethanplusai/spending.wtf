import { useSnapshot } from "../environment";
import Discovery from "../components/Discovery";
import DebtExperience from "../components/DebtExperience";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Download,
  Landmark,
  BookOpen,
  Globe2,
  ChevronDown,
} from "lucide-react";
import { money, download, sources } from "../data";
import type { Data, Snapshot, Page } from "../data";
import Chart from "../Chart";
import type { Point } from "../Chart";
import Metric from "../components/Metric";

function Overview({
  data,
  go,
}: {
  data: Data;
  go: (p: Page, extra?: Record<string, string>) => void;
}) {
  const years = data.annual.filter((x) => x.year <= 2025),
    [fy, setFy] = useState(2025),
    [range, setRange] = useState("10Y"),
    [mode, setMode] = useState("Nominal"),
    [showTable, setShowTable] = useState(false),
    [debt, setDebt] = useState<Snapshot<Record<string, string>[]> | null>(
      useSnapshot<Snapshot<Record<string, string>[]>>("debt"),
    );
  useEffect(() => {
    fetch("/data/debt.json")
      .then((r) => r.json())
      .then(setDebt)
      .catch(() => {});
    fetch("/api/debt")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setDebt)
      .catch(() => {});
  }, []);
  const year = years.find((x) => x.year === fy) ?? years.at(-1)!,
    prior = years.find((x) => x.year === fy - 1),
    cpi = (y: number) => data.cpi.find((x) => x.year === y)?.value;
  const priceYear = data.cpi.at(-1)!.year;
  const filtered = years.filter(
    (x) =>
      x.year <= fy &&
      x.year >=
        fy -
          (range === "5Y" ? 4 : range === "1Y" ? 0 : range === "All" ? 100 : 9),
  );
  const points: Point[] =
    range === "1Y"
      ? data.monthly
          .filter((x) => x.year === fy)
          .map((x) => ({
            year: x.year,
            label: x.label.slice(0, 3),
            value: x.spending,
            second: x.revenue,
          }))
      : filtered
          .filter((x) => mode === "Nominal" || cpi(x.year))
          .map((x) => {
            const scale =
              mode === "Nominal"
                ? 1
                : (cpi(priceYear) ?? 1) / (cpi(x.year) ?? 1);
            return {
              year: x.year,
              value: x.spending * scale,
              second: x.revenue * scale,
            };
          });
  const deficit = year.spending - year.revenue,
    totalDebt = Number(debt?.data[0]?.tot_pub_debt_out_amt),
    dep = data.departments.slice(0, 6);
  return (
    <>
      <DebtExperience data={data} go={go} />
      <Discovery go={go} />
      <section className="section" id="national-picture">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / THE NATIONAL PICTURE</span>
            <h2>America’s balance sheet.</h2>
          </div>
          <label className="select-wrap">
            <span>Fiscal year</span>
            <select
              aria-label="Fiscal year"
              value={fy}
              onChange={(e) => setFy(+e.target.value)}
            >
              {years
                .slice()
                .reverse()
                .map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year}
                  </option>
                ))}
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
        <div className="metrics">
          <Metric
            label="Federal spending"
            value={money(year.spending)}
            note={
              prior
                ? `${((year.spending / prior.spending - 1) * 100).toFixed(1)}% from FY ${prior.year}`
                : "Cash outlays"
            }
            trend
          />
          <Metric
            label="Federal revenue"
            value={money(year.revenue)}
            note="Taxes & other receipts"
          />
          <Metric
            label="Budget deficit"
            value={money(deficit)}
            note={`${((deficit / year.spending) * 100).toFixed(1)}% of spending was borrowed`}
            red
          />
          <Metric
            label="Total national debt"
            value={debt ? money(totalDebt) : "—"}
            note={
              debt
                ? `Treasury · ${debt.data[0].record_date}`
                : "Loading Treasury observation"
            }
            red
          />
        </div>
        <div className="source-line">
          <span>
            <span className="live-dot" /> Reported observations, not a simulated
            debt clock
          </span>
          <a href={sources.treasury} target="_blank" rel="noreferrer">
            U.S. Treasury Fiscal Data <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="chart-panel">
          <div className="panel-heading">
            <div>
              <h3>The gap keeps adding up.</h3>
              <p>
                Federal spending and revenue,{" "}
                {range === "1Y"
                  ? `monthly in FY ${fy}`
                  : `FY ${points[0]?.year}–${points.at(-1)?.year}`}
              </p>
            </div>
            <div className="chart-tools">
              <div className="segmented">
                {["1Y", "5Y", "10Y", "All"].map((x) => (
                  <button
                    key={x}
                    className={range === x ? "selected" : ""}
                    onClick={() => setRange(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
              <button
                className="icon-btn"
                aria-label="Download chart data"
                onClick={() =>
                  download(
                    "federal-budget.csv",
                    points.map((p) => ({
                      period: p.label ?? p.year,
                      spending: p.value,
                      revenue: p.second,
                      units:
                        range === "1Y" || mode === "Nominal"
                          ? "USD"
                          : `${priceYear} purchasing power USD`,
                      source: sources.treasury,
                    })),
                  )
                }
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          <div className="chart-subhead">
            <span className="unit-label">
              {range === "1Y"
                ? "NOMINAL DOLLARS"
                : mode === "Nominal"
                  ? "NOMINAL DOLLARS"
                  : `${priceYear} DOLLARS · CPI-U ADJUSTED`}
            </span>
            {range !== "1Y" && (
              <div className="text-toggle">
                {["Nominal", "Inflation adjusted"].map((x) => (
                  <button
                    key={x}
                    className={mode === x ? "selected" : ""}
                    onClick={() => setMode(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Chart points={points} />
          <div className="panel-foot">
            <span>
              FY {fy}: <b>{money(deficit)} more spent than collected.</b>{" "}
              {range !== "1Y" &&
                mode !== "Nominal" &&
                `CPI adjustment uses complete calendar-year averages in ${priceYear} dollars; incomplete years are omitted.`}
            </span>
            <button
              className="text-link"
              onClick={() => setShowTable(!showTable)}
            >
              {showTable ? "Hide" : "View"} data table <ChevronDown size={12} />
            </button>
          </div>
          {showTable && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Spending</th>
                    <th>Revenue</th>
                    <th>Deficit</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr key={i}>
                      <td>{p.label ?? p.year}</td>
                      <td>{money(p.value)}</td>
                      <td>{money(p.second ?? 0)}</td>
                      <td>{money(p.value - (p.second ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="two-col">
          <div className="allocation-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">WHERE IT GOES</span>
                <h3>The largest federal departments.</h3>
              </div>
              <Landmark size={21} />
            </div>
            <p className="muted">FY 2025 net outlays · selected departments</p>
            <div className="allocation-bar">
              {dep.map((d, i) => (
                <div
                  key={d.name}
                  style={{
                    flex: d.amount,
                    background: [
                      "#19191f",
                      "#53535f",
                      "#838391",
                      "#e5233c",
                      "#f58b98",
                      "#d9d9e0",
                    ][i],
                  }}
                  title={`${d.name}: ${money(d.amount)}`}
                />
              ))}
            </div>
            {dep.map((d, i) => (
              <button
                className="agency-row"
                key={d.name}
                onClick={() => go("contracts", { agency: d.name })}
              >
                <span>
                  <i
                    style={{
                      background: [
                        "#19191f",
                        "#53535f",
                        "#838391",
                        "#e5233c",
                        "#f58b98",
                        "#d9d9e0",
                      ][i],
                    }}
                  />
                  {d.name
                    .replace("Department of ", "")
                    .replace(
                      "Social Security Administration",
                      "Social Security",
                    )}
                </span>
                <b>
                  {money(d.amount)} <ArrowUpRight size={13} />
                </b>
              </button>
            ))}
            <div className="panel-foot">
              <span>
                Department totals include benefits and other non-contract
                spending.
              </span>
            </div>
          </div>
          <div className="story-card">
            <span className="eyebrow">THE BIGGER STORY</span>
            <div className="story-year">
              1971<span>↗</span>
            </div>
            <h3>
              A dollar isn’t
              <br />
              what it used to be.
            </h3>
            <p>
              When the gold window closed, the monetary system changed. Explore
              what happened to debt, prices, and your purchasing power.
            </p>
            <button className="text-link" onClick={() => go("history")}>
              Explore debt & the dollar <ArrowRight size={16} />
            </button>
            <span className="story-note">
              HISTORY, WITH CONTEXT. NOT JUST CORRELATION.
            </span>
          </div>
        </div>
      </section>
      <section className="explore-strip">
        <span className="eyebrow">02 / MAKE YOUR OWN CONNECTIONS</span>
        <div className="section-heading">
          <h2>
            Don’t just see the number.
            <br />
            See what’s behind it.
          </h2>
          <p>
            From a national balance sheet to an individual
            <br />
            contract. The public record is yours to explore.
          </p>
        </div>
        <div className="explore-cards">
          {[
            {
              icon: Search,
              title: "Follow a federal contract",
              text: "Search awards, recipients, agencies, and dates. Go straight to the source.",
              p: "contracts" as Page,
            },
            {
              icon: Globe2,
              title: "Bring it closer to home",
              text: "Explore federal contracts in your state and discover state and local records.",
              p: "places" as Page,
            },
            {
              icon: BookOpen,
              title: "Know what you’re looking at",
              text: "Understand the definitions, coverage gaps, and limits behind every number.",
              p: "methodology" as Page,
            },
          ].map((c) => (
            <button key={c.title} onClick={() => go(c.p)}>
              <c.icon size={23} />
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <ArrowUpRight className="card-arrow" size={22} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

export default Overview;
