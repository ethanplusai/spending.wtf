import { useSearch, useSnapshot } from "../environment";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  X,
  Download,
  SlidersHorizontal,
  Bookmark,
  ExternalLink,
  Landmark,
  Network,
  Scale,
} from "lucide-react";
import Subawards from "../components/Subawards";
import { money, download, stateCodes, readJSON, kindLabels } from "../data";
import type { Award, Snapshot, AwardKind } from "../data";

function Contracts({
  saved,
  save,
  notebook,
  notify,
}: {
  saved: Award[];
  save: (a: Award) => void;
  notebook: boolean;
  notify: (s: string) => void;
}) {
  const q = useSearch();
  const [rows, setRows] = useState<Award[]>(
      useSnapshot<Award[]>("starter-awards") ?? [],
    ),
    [kind, setKind] = useState<AwardKind>(
      (q.get("kind") as AwardKind) || "all",
    ),
    [recipient, setRecipient] = useState(q.get("recipient") ?? ""),
    [program, setProgram] = useState(q.get("program") ?? ""),
    [country, setCountry] = useState(q.get("country") ?? ""),
    [scope, setScope] = useState(q.get("scope") ?? "all"),
    [query, setQuery] = useState(q.get("q") ?? ""),
    [start, setStart] = useState(q.get("start") ?? "2024-10-01"),
    [end, setEnd] = useState(q.get("end") ?? "2025-09-30"),
    [state, setState] = useState(q.get("state") ?? ""),
    [agency, setAgency] = useState(q.get("agency") ?? ""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [source, setSource] = useState(useSnapshot<string>("starter-source") ?? ""),
    [selected, setSelected] = useState<Award | null>(null),
    [page, setPage] = useState(1),
    [hasNext, setHasNext] = useState(false),
    [appliedSearch, setAppliedSearch] = useState(""),
    [view, setView] = useState("Awards"),
    [local, setLocal] = useState(""),
    [detail, setDetail] = useState<Record<string, unknown> | null>(null),
    [detailError, setDetailError] = useState("");
  const searchKey = JSON.stringify({
    query,
    start,
    end,
    state,
    agency,
    kind,
    recipient,
    program,
    country,
    scope,
  });
  const abort = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let active = true;
    Promise.all(
      ["grants", "contracts", "direct", "other"].map((k) =>
        fetch(`/data/explore-${k}-awards.json`).then(
          readJSON<Snapshot<Award[]>>,
        ),
      ),
    )
      .then((snapshots) => {
        if (!active || abort.current) return;
        const samples = Array.from({ length: 10 }, (_, i) =>
          snapshots.map((j) => j.data[i]).filter(Boolean),
        ).flat();
        setRows(samples);
        setSource(
          `Starter selection · 10 largest awards from each of four award types · FY 2025 · retrieved ${snapshots[0].retrievedAt.slice(0, 10)} · search the full public record above`,
        );
      })
      .catch(() => setError("Starter records unavailable. Try a live search."));
    return () => {
      active = false;
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setDetail(null);
    setDetailError("");
    dialog.current?.showModal();
    fetch("/api/awards/" + encodeURIComponent(selected.generated_internal_id), {
      signal: controller.signal,
    })
      .then(async (r) => {
        return readJSON<Record<string, unknown>>(r);
      })
      .then(setDetail)
      .catch((e) => {
        if (e.name !== "AbortError") setDetailError(e.message);
      });
    return () => controller.abort();
  }, [selected]);
  async function search(next = 1, nextKind = kind) {
    setKind(nextKind);
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          start,
          end,
          state,
          agency,
          kind: nextKind,
          recipient,
          program,
          country,
          scope,
          page: next,
        }),
      });
      const j = await readJSON<Snapshot<Award[]> & { hasNext: boolean }>(r);
      setRows(j.data);
      setPage(next);
      setHasNext(j.hasNext);
      setAppliedSearch(
        JSON.stringify({
          query,
          start,
          end,
          state,
          agency,
          kind: nextKind,
          recipient,
          program,
          country,
          scope,
        }),
      );
      setLocal("");
      setSource(
        `Live query · ${kindLabels[nextKind]} · ${start} to ${end} · ${state || "all states"} · ${agency || "all agencies"} · ${query || "all keywords"} · ${recipient || "all recipients"} · ${program || "all programs"} · ${country || scope} · retrieved ${j.retrievedAt.slice(0, 10)} · ${nextKind === "loans" ? "loan face values" : "lifetime award amounts"}`,
      );
      const params = new URLSearchParams({
        kind: nextKind,
        recipient,
        program,
        country,
        scope,
        q: query,
        start,
        end,
        ...(state ? { state } : {}),
        ...(agency ? { agency } : {}),
      });
      history.replaceState({}, "", `/awards?${params}`);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  const initialSearch = useEffectEvent(() => search());
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (
      !notebook &&
      [
        "q",
        "state",
        "agency",
        "start",
        "end",
        "kind",
        "recipient",
        "program",
        "country",
        "scope",
      ].some((k) => params.has(k))
    )
      initialSearch();
  }, [notebook]);
  const display = (notebook ? saved : rows).filter((a) =>
    `${a["Recipient Name"]} ${a["Awarding Agency"]} ${a.Description} ${a["Award ID"]}`
      .toLowerCase()
      .includes(local.toLowerCase()),
  );
  const groups = Object.values(
    display.reduce<
      Record<
        string,
        {
          name: string;
          uei: string;
          amount: number;
          awards: Award[];
          agencies: string[];
        }
      >
    >((acc, a) => {
      const key = a["Recipient UEI"] || a["Recipient Name"];
      const g = (acc[key] ??= {
        name: a["Recipient Name"],
        uei: a["Recipient UEI"],
        amount: 0,
        awards: [],
        agencies: [],
      });
      if (a.awardKind !== "loans") g.amount += a["Award Amount"];
      g.awards.push(a);
      if (!g.agencies.includes(a["Awarding Agency"]))
        g.agencies.push(a["Awarding Agency"]);
      return acc;
    }, {}),
  ).sort((a, b) => b.amount - a.amount);
  function exportRows() {
    download(
      "contract-research.csv",
      display.map((a) => ({
        ...a,
        source_url: `https://www.usaspending.gov/award/${a.generated_internal_id}`,
        coverage: source,
        measure:
          a.awardKind === "loans"
            ? "Lifetime loan face value; not subsidy cost"
            : "Lifetime award amount; not period obligations",
      })),
    );
  }
  return (
    <section className="section subpage">
      <div className="page-intro">
        <span className="eyebrow">
          {notebook
            ? "YOUR RESEARCH NOTEBOOK"
            : "THE PUBLIC RECORD / CONTRACTS, GRANTS & ASSISTANCE"}
        </span>
        <h1>{notebook ? "Keep the thread." : "Follow the money."}</h1>
        <p>
          {notebook
            ? "Your saved awards, stored in this browser. Export your evidence and keep investigating."
            : "Contracts are only one part of the ledger. Explore grants, benefit payments, loans, recipients, and the programs behind them."}
        </p>
      </div>
      {!notebook && (
        <div className="award-kind-tabs" aria-label="Award type">
          {(Object.keys(kindLabels) as AwardKind[]).map((k) => (
            <button
              key={k}
              aria-pressed={kind === k}
              className={kind === k ? "active" : ""}
              disabled={loading}
              onClick={() => search(1, k)}
            >
              {kindLabels[k]}
            </button>
          ))}
        </div>
      )}
      {!notebook && (
        <form
          className="search-panel"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <div className="search-main">
            <Search size={22} />
            <input
              aria-label="Search federal awards"
              placeholder="Try a topic, award ID, or ‘cancer research’"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn dark" disabled={loading}>
              {loading ? "Searching…" : "Search the record"}{" "}
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="filter-row">
            <span>
              <SlidersHorizontal size={15} /> REFINE
            </span>
            <label>
              From
              <input
                type="date"
                value={start}
                min="2007-10-01"
                max={end}
                required
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={end}
                min={start}
                required
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <label>
              Performance state
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">All states</option>
                {stateCodes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Awarding agency
              <input
                value={agency}
                placeholder="All agencies"
                onChange={(e) => setAgency(e.target.value)}
              />
            </label>
          </div>
          <details className="advanced-filters">
            <summary>Recipient, assistance program & overseas filters</summary>
            <div className="filter-row">
              <label>
                Recipient name or UEI
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Organization or UEI"
                />
              </label>
              <label>
                Assistance listing
                <input
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. 93.778"
                  pattern="[0-9]{2}\.[0-9]{3}"
                />
              </label>
              <label>
                Performance scope
                <select
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value);
                    if (e.target.value === "foreign") setState("");
                  }}
                >
                  <option value="all">Worldwide</option>
                  <option value="domestic">Domestic</option>
                  <option value="foreign">Overseas</option>
                </select>
              </label>
              <label>
                Country code
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="e.g. UKR"
                  maxLength={3}
                  pattern="[A-Z]{3}"
                />
              </label>
            </div>
          </details>
        </form>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}{" "}
          {rows.length > 0
            ? "Existing results below retain their original source and filters."
            : "No results have loaded for this query."}
        </div>
      )}
      <div className="results-heading">
        <div>
          <div className="segmented">
            {["Awards", "Connections"].map((v) => (
              <button
                key={v}
                className={view === v ? "selected" : ""}
                onClick={() => setView(v)}
              >
                {v === "Connections" && <Network size={14} />} {v}
              </button>
            ))}
          </div>
        </div>
        <div className="result-tools">
          <input
            aria-label="Filter loaded records"
            placeholder="Filter loaded records…"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
          <button
            className="text-link"
            onClick={exportRows}
            disabled={!display.length}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            className="icon-btn"
            aria-label="Copy search link"
            onClick={() =>
              navigator.clipboard
                .writeText(location.href)
                .then(() => notify("Search link copied."))
                .catch(() =>
                  notify(
                    "Copy the URL from your address bar to share this search.",
                  ),
                )
            }
          >
            <ExternalLink size={15} />
          </button>
        </div>
      </div>
      <div className="source-line">
        <span>
          {notebook
            ? `${display.length} saved records · browser-local notebook`
            : `${display.length} records on this page · ${source}`}
        </span>
      </div>
      <div className="notice">
        <Scale size={18} />
        <span>
          <b>Follow leads, not assumptions.</b> Award amounts cover their
          lifetime, rather than spending within the selected dates. Loans show
          face value, separately from subsidy cost. Connections describe
          reported relationships, not evidence of fraud.
        </span>
      </div>
      {view === "Awards" ? (
        <div className="table-scroll awards-table">
          <table>
            <thead>
              <tr>
                <th>Recipient / award</th>
                <th>Awarding agency</th>
                <th>Lifetime amount</th>
                <th>State</th>
                <th>Record</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {display.map((a) => (
                <tr key={a.generated_internal_id}>
                  <td>
                    <button
                      className="recipient-link"
                      onClick={() => setSelected(a)}
                    >
                      {a["Recipient Name"]}
                    </button>
                    <small>
                      {a.awardKind || "Award"} · {a["Award ID"]}
                    </small>
                  </td>
                  <td>
                    {a["Awarding Agency"].replace("Department of ", "")}
                    <small>
                      {a["Start Date"]} → {a["End Date"] || "Not reported"}
                    </small>
                  </td>
                  <td className="amount">
                    {money(a["Award Amount"])}
                    {a.awardKind === "loans" && <small>Loan face value</small>}
                  </td>
                  <td>{a["Place of Performance State Code"] || "—"}</td>
                  <td>
                    <button
                      className="icon-btn"
                      aria-label={`View award ${a["Award ID"]}`}
                      onClick={() => setSelected(a)}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      aria-label={`${saved.some((x) => x.generated_internal_id === a.generated_internal_id) ? "Unsave" : "Save"} ${a["Award ID"]}`}
                      onClick={() => save(a)}
                    >
                      <Bookmark
                        size={16}
                        fill={
                          saved.some(
                            (x) =>
                              x.generated_internal_id ===
                              a.generated_internal_id,
                          )
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!display.length && (
            <div className="empty">
              <Search size={26} />
              <h3>
                {notebook
                  ? "Your next investigation starts here."
                  : "No matching records."}
              </h3>
              <p>
                {notebook
                  ? "Save an award from the contract explorer to add it to your notebook."
                  : "Broaden your search or change the dates and filters."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="connections">
          <div className="connection-intro">
            <Network size={24} />
            <div>
              <h3>The relationships in this result set.</h3>
              <p>
                Agencies → recipients → awards. Grouped by recipient UEI when
                reported, otherwise exact name. Totals cover loaded records
                only; parent-company ownership is not inferred.
              </p>
            </div>
          </div>
          {groups.map((g) => (
            <article className="connection-row" key={g.uei || g.name}>
              <div className="agency-nodes">
                {g.agencies.map((a) => (
                  <span key={a}>
                    <Landmark size={15} />
                    {a.replace("Department of ", "")}
                  </span>
                ))}
              </div>
              <div className="connection-line">
                <ArrowRight size={18} />
              </div>
              <div className="recipient-node">
                <span className="eyebrow">
                  RECIPIENT {g.uei ? `/ ${g.uei}` : "/ UEI UNREPORTED"}
                </span>
                <h3>{g.name}</h3>
                <p>
                  {money(g.amount)} non-loan lifetime amounts ·{" "}
                  {g.awards.length} loaded award
                  {g.awards.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="connection-line">
                <ArrowRight size={18} />
              </div>
              <div className="award-nodes">
                {g.awards.map((a) => (
                  <button
                    key={a.generated_internal_id}
                    onClick={() => setSelected(a)}
                  >
                    {a["Award ID"]} <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      {!notebook && (
        <div className="pagination">
          <span>
            Page {page} ·{" "}
            {kind === "all"
              ? "up to 50 per category (200 combined); pages are not a global ranking"
              : "up to 50 awards per page"}
          </span>
          <button
            className="btn"
            disabled={page === 1 || loading || searchKey !== appliedSearch}
            onClick={() => search(page - 1)}
          >
            Previous
          </button>
          <button
            className="btn"
            disabled={!hasNext || loading || searchKey !== appliedSearch}
            onClick={() => search(page + 1)}
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      )}
      <div className="research-guide">
        <span className="eyebrow">INVESTIGATOR’S FIELD NOTES</span>
        <h3>A surprising number is a starting point.</h3>
        <div className="three-col">
          <div>
            <b>01 / Check the scope</b>
            <p>
              Read the description, modifications, and period of performance. A
              contract can bundle hardware, labor, maintenance, and years of
              service.
            </p>
          </div>
          <div>
            <b>02 / Establish comparability</b>
            <p>
              Compare the same specifications, quantity, delivery terms, and
              dates. Missing quantities remain unknown; we never assume one
              unit.
            </p>
          </div>
          <div>
            <b>03 / Follow the evidence</b>
            <p>
              Corroborate a lead with source documents, competition records, and
              audit findings. Save records with their source links before
              drawing conclusions.
            </p>
            <a
              href="https://www.oversight.gov/"
              target="_blank"
              rel="noreferrer"
            >
              Explore inspector general reports <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>
      <dialog
        aria-label="Award details"
        ref={dialog}
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            dialog.current?.close();
            setSelected(null);
          }
        }}
      >
        {selected && (
          <div className="award-detail">
            <button
              className="icon-btn close-dialog"
              aria-label="Close award detail"
              onClick={() => {
                dialog.current?.close();
                setSelected(null);
              }}
            >
              <X />
            </button>
            <span className="eyebrow">FEDERAL AWARD / SOURCE RECORD</span>
            <h2>{selected["Recipient Name"]}</h2>
            <div className="detail-amount">
              {money(selected["Award Amount"])}
              <span>
                {selected.awardKind === "loans"
                  ? "Loan face value"
                  : "Lifetime award amount"}
              </span>
            </div>
            <dl>
              <dt>Award ID</dt>
              <dd>{selected["Award ID"]}</dd>
              <dt>Awarding agency</dt>
              <dd>{selected["Awarding Agency"]}</dd>
              <dt>Recipient UEI</dt>
              <dd>{selected["Recipient UEI"] || "Not reported"}</dd>
              <dt>Performance period</dt>
              <dd>
                {selected["Start Date"]} –{" "}
                {selected["End Date"] || "Not reported"}
              </dd>
              <dt>Place of performance</dt>
              <dd>
                {selected["Place of Performance State Code"] || "Not reported"}
              </dd>
            </dl>
            {selected["Assistance Listings"]?.length ? (
              <div className="assistance-links">
                <h3>Follow this assistance program</h3>
                {selected["Assistance Listings"].map((p, i) => (
                  <a
                    className="text-link"
                    key={i}
                    href={`/awards?kind=all&program=${encodeURIComponent(p.cfda_number)}`}
                  >
                    {p.cfda_number} · {p.cfda_program_title}{" "}
                    <ArrowUpRight size={14} />
                  </a>
                ))}
              </div>
            ) : null}
            {selected.awardKind === "loans" && (
              <p>
                Reported subsidy cost:{" "}
                {selected["Subsidy Cost"] == null
                  ? "Not reported"
                  : money(selected["Subsidy Cost"])}
                . Face value is not the cost to taxpayers.
              </p>
            )}
            <a
              className="text-link"
              href={`/awards?kind=all&recipient=${encodeURIComponent(selected["Recipient UEI"] || selected["Recipient Name"])}`}
            >
              Explore all awards to this recipient <ArrowUpRight size={14} />
            </a>
            <h3>Reported description</h3>
            <p className="description">
              {selected.Description || "No description reported."}
            </p>
            <h3>Verification details</h3>
            {detail ? (
              <dl>
                <dt>Date signed</dt>
                <dd>{String(detail.date_signed ?? "Not reported")}</dd>
                <dt>Reported obligations</dt>
                <dd>
                  {Number.isFinite(Number(detail.total_obligation)) &&
                  detail.total_obligation != null
                    ? money(Number(detail.total_obligation))
                    : "Not reported"}
                </dd>
              </dl>
            ) : (
              <p className="muted">
                {detailError || "Loading additional source details…"}
              </p>
            )}
            <AwardEvidence detail={detail} />
            <Subawards
              key={selected.generated_internal_id}
              awardId={selected.generated_internal_id}
            />
            <a
              className="text-link"
              href={`/nonprofits?name=${encodeURIComponent(selected["Recipient Name"])}`}
            >
              Look for nonprofit filings for this name ↗
            </a>
            <div className="notice">
              Unit price cannot be established from an award total alone. No
              verified line-item quantity is available here.
            </div>
            <div className="detail-actions">
              <a
                className="btn dark"
                href={`https://www.usaspending.gov/award/${selected.generated_internal_id}`}
                target="_blank"
                rel="noreferrer"
              >
                Open USAspending record <ExternalLink size={15} />
              </a>
              <button className="btn" onClick={() => save(selected)}>
                <Bookmark size={15} />
                {saved.some(
                  (x) =>
                    x.generated_internal_id === selected.generated_internal_id,
                )
                  ? "Saved"
                  : "Save award"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
function AwardEvidence({ detail }: { detail: Record<string, unknown> | null }) {
  if (!detail) return null;
  const contract = detail.latest_transaction_contract_data as
    Record<string, unknown> | undefined;
  if (!contract)
    return (
      <p className="muted">
        Competition details are not reported for this record.
      </p>
    );
  const field = (key: string) =>
    contract[key] == null ? "Not reported" : String(contract[key]);
  return (
    <div className="evidence">
      <h3>Procurement context</h3>
      <p className="muted">
        Latest reported contract transaction. Competition and pricing terms can
        change over the life of an award.
      </p>
      <dl>
        <dt>Competition</dt>
        <dd>{field("extent_competed_description")}</dd>
        <dt>Offers received</dt>
        <dd>{field("number_of_offers_received")}</dd>
        <dt>Pricing structure</dt>
        <dd>{field("type_of_contract_pricing_description")}</dd>
        <dt>Product / service</dt>
        <dd>
          {field("product_or_service_code")} ·{" "}
          {field("product_or_service_description")}
        </dd>
        <dt>NAICS industry</dt>
        <dd>
          {field("naics")} · {field("naics_description")}
        </dd>
        <dt>Reported subawards</dt>
        <dd>{String(detail.subaward_count ?? "Not reported")}</dd>
      </dl>
      {String(contract.number_of_offers_received) === "1" && (
        <div className="notice">
          <span>
            <b>Research lead: one reported offer.</b> Review solicitation
            requirements and competition history. A single offer can have
            legitimate explanations and does not establish misconduct.
          </span>
        </div>
      )}
      {contract.other_than_full_and_open_description != null && (
        <p className="muted">
          Reported competition exception:{" "}
          {String(contract.other_than_full_and_open_description)}
        </p>
      )}
    </div>
  );
}

export default Contracts;
