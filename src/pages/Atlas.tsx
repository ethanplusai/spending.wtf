import { useSearch, useSnapshot } from "../environment";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  Search,
  Globe2,
  Network,
  Landmark,
} from "lucide-react";
import { download, money, readJSON, kindLabels } from "../data";
import type { AwardKind, AggregateRow, ExploreResult, Page } from "../data";
import Chart from "../Chart";
type Dimension = "programs" | "recipients" | "agencies" | "countries";
type RawRow = AggregateRow & {
  shape_code?: string;
  display_name?: string;
  aggregated_amount?: number;
  uei?: string;
};
const dimensions: Record<Dimension, string> = {
  programs: "Assistance programs",
  recipients: "Recipients",
  agencies: "Awarding agencies",
  countries: "Overseas",
};
export default function Atlas({
  go,
}: {
  go: (p: Page, extra?: Record<string, string>) => void;
}) {
  const q = useSearch(),
    initial = (q.get("dimension") || "programs") as Dimension;
  const [dimension, setDimension] = useState<Dimension>(
      Object.hasOwn(dimensions, initial) ? initial : "programs",
    ),
    [kind, setKind] = useState<AwardKind>("all"),
    [start, setStart] = useState("2024-10-01"),
    [end, setEnd] = useState("2025-09-30"),
    [result, setResult] = useState<ExploreResult<RawRow[]> | null>(
      useSnapshot<ExploreResult<RawRow[]>>(`explore-all-${dimension}`),
    ),
    [query, setQuery] = useState(""),
    [activeCode, setActiveCode] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [timeline, setTimeline] = useState<{ year: number; value: number }[]>([]),
    [snapshotMode, setSnapshotMode] = useState(true),
    [applied, setApplied] = useState({ dimension, kind, start, end });
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const c = new AbortController();
    request.current?.abort();
    request.current = c;
    setLoading(true);
    setError("");
    setResult(null);
    setQuery("");
    setActiveCode("");
    setKind("all");
    setStart("2024-10-01");
    setEnd("2025-09-30");
    setPage(1);
    fetch(`/data/explore-all-${dimension}.json`, { signal: c.signal })
      .then(readJSON<ExploreResult<RawRow[]>>)
      .then((j) => {
        setResult(j);
        setApplied({
          dimension,
          kind: "all",
          start: "2024-10-01",
          end: "2025-09-30",
        });
        setSnapshotMode(true);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    const p = new URLSearchParams({ dimension });
    window.history.replaceState(
      {},
      "",
      dimension === "programs" ? "/funding" : `/funding?${p}`,
    );
    return () => c.abort();
  }, [dimension]);
  useEffect(() => {
    let current = true;
    fetch("/data/explore-all-timeline.json")
      .then(
        readJSON<
          ExploreResult<
            {
              time_period: { fiscal_year: string };
              aggregated_amount: number;
            }[]
          >
        >,
      )
      .then((j) => {
        if (current)
          setTimeline(
            j.data.map((r) => ({
              year: +r.time_period.fiscal_year,
              value: r.aggregated_amount,
            })),
          );
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, []);
  async function search(next = 1) {
    request.current?.abort();
    const c = new AbortController();
    request.current = c;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/v1/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: c.signal,
        body: JSON.stringify({
          dimension,
          kind,
          start,
          end,
          page: next,
          scope: dimension === "countries" ? "foreign" : "all",
        }),
      });
      const j = await readJSON<ExploreResult<RawRow[]>>(r);
      setResult(j);
      setApplied({ dimension, kind, start, end });
      setSnapshotMode(false);
      setPage(next);
      setActiveCode("");
      setQuery("");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      if (!c.signal.aborted) setLoading(false);
    }
  }
  const pendingFilters =
    kind !== applied.kind || start !== applied.start || end !== applied.end;
  const rows = (result?.data || [])
      .map((r) => ({
        ...r,
        name: r.name || r.display_name || "Unreported",
        amount: r.amount ?? r.aggregated_amount ?? 0,
        code: r.code || r.shape_code || r.uei || r.name,
      }))
      .filter((r) =>
        `${r.name} ${r.code}`.toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => b.amount - a.amount),
    active = rows.find((r) => r.code === activeCode) || rows[0],
    max = Math.max(...rows.map((r) => Math.abs(r.amount)), 1),
    loadedTotal = rows.reduce((s, r) => s + r.amount, 0);
  const singleRecipient = active && active.name !== "MULTIPLE RECIPIENTS";
  function follow() {
    if (!active) return;
    go("contracts", {
      kind: applied.kind,
      start: applied.start,
      end: applied.end,
      ...(dimension === "countries"
        ? { country: active.code, scope: "foreign" }
        : dimension === "programs"
          ? { program: active.code }
          : dimension === "agencies"
            ? { agency: active.name }
            : { recipient: active.uei || active.name }),
    });
  }
  return (
    <section className="section subpage atlas-page">
      <div className="page-intro">
        <span className="eyebrow">
          THE FUNDING ATLAS / CONNECT THE PUBLIC RECORD
        </span>
        <h1>
          There’s a trail.
          <br />
          Start anywhere.
        </h1>
        <p>
          Find a program. Follow its recipients. Open the awards. Explore the
          federal funding network beyond the biggest defense contracts.
        </p>
      </div>
      <div className="atlas-tabs">
        {(Object.entries(dimensions) as [Dimension, string][]).map(([d, l]) => (
          <button
            key={d}
            className={dimension === d ? "active" : ""}
            aria-pressed={dimension === d}
            onClick={() => setDimension(d)}
          >
            {d === "countries" ? (
              <Globe2 size={18} />
            ) : d === "recipients" ? (
              <Network size={18} />
            ) : (
              <Landmark size={18} />
            )}{" "}
            {l}
          </button>
        ))}
      </div>
      <div className="atlas-extra">
        <button className="text-link" onClick={() => go("organizations")}>
          Explore nonprofit finances & IRS filings <ArrowUpRight size={14} />
        </button>
        <a className="text-link" href="/agents/README.md">
          Query this data with an agent ↗
        </a>
      </div>
      <form
        className="atlas-filters"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <label>
          Award type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AwardKind)}
          >
            {Object.entries(kindLabels).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            aria-label="Atlas from"
            type="date"
            min="2007-10-01"
            max={end}
            value={start}
            required
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            aria-label="Atlas to"
            type="date"
            min={start}
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <button className="btn dark" disabled={loading}>
          {loading ? "Loading…" : "Query public records"}
          <ArrowRight size={15} />
        </button>
      </form>
      {error && (
        <p className="notice error" role="alert">
          {error}{" "}
          {result ? "The displayed data retains its previous coverage." : ""}
        </p>
      )}
      <div className="source-line">
        {result ? (
          <span>
            {snapshotMode ? "Saved source snapshot" : "Live source query"} ·{" "}
            {applied.start} to {applied.end} · {kindLabels[applied.kind]} ·
            retrieved {result.retrievedAt.slice(0, 10)} · transaction
            obligations
          </span>
        ) : (
          <span>Opening the funding atlas…</span>
        )}
      </div>
      {dimension === "countries" && (
        <div className="overseas-heading">
          <Globe2 size={46} />
          <div>
            <span className="eyebrow">
              REPORTED WORK OUTSIDE THE UNITED STATES
            </span>
            <strong>{money(loadedTotal)}</strong>
            <p>
              {rows.length} reported locations in this view. Includes contracts
              and assistance; negative obligations are retained.
            </p>
          </div>
          <p>
            Overseas performance is not the same as foreign aid, a foreign
            recipient, or the final destination of every dollar. Domestic
            recipients can perform work abroad.
          </p>
        </div>
      )}
      <div className="atlas-workbench">
        <div>
          <div className="atlas-list-head">
            <div className="search-small">
              <Search size={16} />
              <input
                aria-label="Filter atlas results"
                placeholder={`Find ${dimension === "countries" ? "a country" : "a " + dimension.slice(0, -1)}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="icon-btn"
              aria-label="Export atlas data"
              onClick={() =>
                download(
                  `funding-${dimension}.csv`,
                  rows.map((r) => ({
                    name: r.name,
                    code: r.code,
                    obligations_usd: r.amount,
                    start: applied.start,
                    end: applied.end,
                    source: result?.source,
                    retrieved_at: result?.retrievedAt,
                  })),
                )
              }
            >
              <Download size={16} />
            </button>
          </div>
          <div className="atlas-list">
            {rows.map((r, i) => (
              <button
                key={r.code || i}
                aria-pressed={r.code === active?.code}
                className={r.code === active?.code ? "active" : ""}
                onClick={() => setActiveCode(r.code)}
              >
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <span className="atlas-row-title">
                  <b>{r.name}</b>
                  <small>
                    {dimension === "programs"
                      ? `Assistance listing ${r.code}`
                      : dimension === "countries"
                        ? r.code
                        : dimension === "recipients"
                          ? r.uei
                            ? `UEI ${r.uei}`
                            : "Recipient identifier not reported"
                          : "Federal awarding agency"}
                  </small>
                  <i
                    style={{ width: `${(Math.abs(r.amount) / max) * 100}%` }}
                  />
                </span>
                <strong>{money(r.amount)}</strong>
                <ArrowUpRight size={14} />
              </button>
            ))}
            {!rows.length && (
              <p className="empty">
                {loading
                  ? "Loading source records…"
                  : "No matching records. Try a broader query."}
              </p>
            )}
          </div>
        </div>
        {active && (
          <aside className="atlas-inspector">
            <span className="eyebrow">OPEN A THREAD</span>
            <div className="thread-origin">
              <Landmark size={19} />
              <span>Federal award transactions</span>
            </div>
            <div className="thread-stem" />
            <div className="thread-subject">
              <small>{dimensions[dimension]}</small>
              <h2>{active.name}</h2>
              <strong>{money(active.amount)}</strong>
              <p>
                Net obligations · {applied.start}–{applied.end}
              </p>
            </div>
            <div className="thread-stem" />
            <div className="thread-destination">
              <span>
                {dimension === "programs"
                  ? "Which organizations received funding?"
                  : dimension === "countries"
                    ? "Which awards report work here?"
                    : dimension === "agencies"
                      ? "What did this agency award?"
                      : "What awards connect to this recipient?"}
              </span>
              <button
                className="btn dark"
                disabled={dimension === "recipients" && !singleRecipient}
                onClick={follow}
              >
                Open the award trail <ArrowRight size={15} />
              </button>
            </div>
            {dimension === "recipients" && !singleRecipient && (
              <p className="notice">
                This is an aggregate beneficiary label, not a single
                organization. Individual benefit recipients are not exposed as a
                searchable public list.
              </p>
            )}
            <p className="source-caption">
              {dimension === "programs"
                ? "Assistance listings identify federal programs. An award can reference multiple listings; program totals should not be added as a deduplicated government-wide total."
                : dimension === "recipients"
                  ? "Recipient records can represent organizations, individuals, or aggregate beneficiaries. Similar names alone do not establish shared ownership."
                  : "Net obligations include new commitments and reductions to earlier commitments. They differ from lifetime award amounts and cash outlays."}
            </p>
            <a className="text-link" href={result?.source}>
              USAspending source endpoint <ArrowUpRight size={14} />
            </a>
          </aside>
        )}
      </div>
      <div className="pagination">
        <span>
          {dimension === "countries"
            ? `${rows.length} reported geographies`
            : `Page ${page} · up to 100 aggregated records`}{" "}
          ·{" "}
          {result?.hasNext ? "More records available" : "End of source results"}
        </span>
        <button
          className="btn"
          disabled={page === 1 || loading || pendingFilters}
          onClick={() => search(page - 1)}
        >
          Previous
        </button>
        <button
          className="btn"
          disabled={!result?.hasNext || loading || pendingFilters}
          onClick={() => search(page + 1)}
        >
          Next <ArrowRight size={14} />
        </button>
      </div>
      <div className="panel atlas-context">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">THE WIDER CONTEXT</span>
            <h3>Nine years of reported award obligations.</h3>
            <p>
              National non-loan awards, FY 2017–2025. This chart has its own
              fixed coverage; it is not filtered by the atlas controls.
            </p>
          </div>
        </div>
        <Chart points={timeline} label="Net obligations" />
        <details>
          <summary>View exact annual totals</summary>
          <table>
            <thead>
              <tr>
                <th>FY</th>
                <th>Net obligations, USD</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((r) => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td>{r.value.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
      <div className="notice">
        All non-loan awards includes contracts, grants, direct payments, and
        other assistance. Loans have distinct accounting and are a separate
        filter. Aggregate results query the source’s full matching records; the
        on-screen ranking is paginated.
      </div>
    </section>
  );
}
