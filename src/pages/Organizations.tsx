import { useSearch } from "../environment";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Search, Download } from "lucide-react";
import { money, readJSON, download, stateCodes } from "../data";
import type { Page, Snapshot } from "../data";
import Chart from "../Chart";
type Organization = {
  ein: number;
  strein: string;
  name: string;
  city: string;
  state: string;
  address?: string;
};
type Filing = {
  tax_prd: number;
  tax_prd_yr: number;
  totrevenue: number | null;
  totfuncexpns: number | null;
  totassetsend: number | null;
  totliabend: number | null;
  pdf_url: string | null;
};
type SearchData = {
  organizations: Organization[];
  total_results: number;
  num_pages: number;
};
type Profile = {
  organization: Organization;
  filings_with_data: Filing[];
  filings_without_data: Pick<Filing, "tax_prd" | "tax_prd_yr" | "pdf_url">[];
};
const ein = (n: number) => String(n).padStart(9, "0");
export default function Organizations({
  go,
}: {
  go: (p: Page, extra?: Record<string, string>) => void;
}) {
  const [query, setQuery] = useState(useSearch().get("name") || "university"),
    [state, setState] = useState(""),
    [results, setResults] = useState<Snapshot<SearchData> | null>(null),
    [profile, setProfile] = useState<Snapshot<Profile> | null>(null),
    [selectedPeriod, setSelectedPeriod] = useState<number | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [page, setPage] = useState(0),
    [profileError, setProfileError] = useState("");
  const controller = useRef<AbortController | null>(null),
    searchController = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      searchController.current?.abort();
    },
    [],
  );
  async function search(n = 0) {
    searchController.current?.abort();
    const c = new AbortController();
    searchController.current = c;
    setLoading(true);
    setError("");
    try {
      const j = await fetch("/api/v1/nonprofits/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: c.signal,
        body: JSON.stringify({ query, state, page: n }),
      }).then(readJSON<Snapshot<SearchData>>);
      setResults(j);
      setPage(n);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      if (!c.signal.aborted) setLoading(false);
    }
  }
  async function open(org: Organization) {
    controller.current?.abort();
    const c = new AbortController();
    controller.current = c;
    setProfile(null);
    setProfileError("Loading public filings…");
    try {
      const j = await fetch("/api/v1/nonprofits/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: c.signal,
        body: JSON.stringify({ ein: ein(org.ein) }),
      }).then(readJSON<Snapshot<Profile>>);
      setProfile(j);
      setSelectedPeriod(null);
      setProfileError("");
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setProfileError((e as Error).message);
    }
  }
  const filings = profile?.data.filings_with_data || [],
    latest = [...filings].sort((a, b) => b.tax_prd - a.tax_prd)[0],
    filing = filings.find((r) => r.tax_prd === selectedPeriod) || latest,
    org = profile?.data.organization;
  const points = [...filings]
    .filter(
      (f) =>
        typeof f.totrevenue === "number" && typeof f.totfuncexpns === "number",
    )
    .sort((a, b) => a.tax_prd - b.tax_prd)
    .map((f) => ({
      year: f.tax_prd_yr,
      label: String(f.tax_prd),
      value: f.totrevenue!,
      second: f.totfuncexpns!,
    }));
  return (
    <section className="section subpage">
      <div className="page-intro">
        <span className="eyebrow">FOLLOW THE ORGANIZATION / IRS FORM 990</span>
        <h1>Beyond the award.</h1>
        <p>
          Open nonprofit finances and original tax filings. Then investigate
          potential links to federal awards, with the identifiers and source
          documents in view.
        </p>
      </div>
      <button className="text-link" onClick={() => go("atlas")}>
        ← Back to the funding atlas
      </button>
      <form
        className="nonprofit-search search-panel"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <div className="search-main">
          <Search size={19} />
          <input
            aria-label="Search nonprofit organizations"
            placeholder="Organization name or city"
            value={query}
            minLength={2}
            required
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Nonprofit state"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">All states</option>
            {stateCodes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="btn dark" disabled={loading}>
            {loading ? "Searching…" : "Search filings"}
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
      {!results && !loading && (
        <div className="nonprofit-start panel">
          <span className="eyebrow">A DIFFERENT PUBLIC RECORD</span>
          <h2>What is inside a Form 990?</h2>
          <div className="three-col">
            <div>
              <h3>Revenue & expenses</h3>
              <p>See an organization’s reported finances across tax periods.</p>
            </div>
            <div>
              <h3>Assets & liabilities</h3>
              <p>Inspect the balance sheet and open the underlying filing.</p>
            </div>
            <div>
              <h3>Funding leads</h3>
              <p>
                Search potential award matches, then verify the entity’s
                identity.
              </p>
            </div>
          </div>
        </div>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="atlas-workbench">
        <div>
          {results && (
            <div className="source-caption">
              {results.data.total_results.toLocaleString()} source matches ·
              page {page + 1} · retrieved {results.retrievedAt.slice(0, 10)}
            </div>
          )}
          <div className="atlas-list">
            {results?.data.organizations.map((o) => (
              <button
                key={o.ein}
                className={org?.ein === o.ein ? "active" : ""}
                onClick={() => open(o)}
              >
                <span className="atlas-row-title">
                  <b>{o.name}</b>
                  <small>
                    EIN {o.strein || ein(o.ein)} · {o.city}, {o.state}
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          {results && (
            <div className="pagination">
              <button
                className="btn"
                disabled={page === 0 || loading}
                onClick={() => search(page - 1)}
              >
                Previous
              </button>
              <button
                className="btn"
                disabled={page + 1 >= results.data.num_pages || loading}
                onClick={() => search(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
        <aside className="nonprofit-profile">
          {profileError && <p role="status">{profileError}</p>}
          {org && (
            <>
              <span className="eyebrow">EIN {org.strein || ein(org.ein)}</span>
              <h2>{org.name}</h2>
              <p>
                {org.city}, {org.state}
              </p>
              {filing ? (
                <>
                  <label>
                    Tax period ending{" "}
                    <select
                      aria-label="Nonprofit tax period"
                      value={filing.tax_prd}
                      onChange={(e) => setSelectedPeriod(+e.target.value)}
                    >
                      {filings.map((f, i) => (
                        <option key={`${f.tax_prd}-${i}`} value={f.tax_prd}>
                          {String(f.tax_prd).slice(0, 4)}-
                          {String(f.tax_prd).slice(4)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="nonprofit-metrics">
                    {[
                      ["Revenue", filing.totrevenue],
                      ["Expenses", filing.totfuncexpns],
                      ["Assets", filing.totassetsend],
                      ["Liabilities", filing.totliabend],
                    ].map(([l, v]) => (
                      <div key={String(l)}>
                        <small>{l}</small>
                        <strong>
                          {typeof v === "number" ? money(v) : "Not reported"}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <Chart
                    points={points}
                    label="Revenue"
                    secondLabel="Expenses"
                  />
                  <button
                    className="text-link"
                    onClick={() =>
                      download(
                        `nonprofit-${ein(org.ein)}.csv`,
                        filings.map((f) => ({
                          ...f,
                          ein: ein(org.ein),
                          source: profile?.source,
                          retrieved_at: profile?.retrievedAt,
                        })),
                      )
                    }
                  >
                    <Download size={14} /> Export reported finances
                  </button>
                  {filing.pdf_url?.startsWith("https://") && (
                    <a
                      className="btn"
                      href={filing.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open original filing <ArrowUpRight size={14} />
                    </a>
                  )}
                </>
              ) : (
                <p>
                  No extracted financial filings available. Check the source
                  profile for original documents.
                </p>
              )}
              <a
                className="text-link"
                href={`https://projects.propublica.org/nonprofits/organizations/${ein(org.ein)}`}
              >
                ProPublica source profile ↗
              </a>
              <div className="notice">
                A matching name is a lead, not a verified EIN-to-UEI link.
                Nonprofit revenue includes funding beyond federal grants. Verify
                the organization and period before comparing totals.
              </div>
              <button
                className="btn dark"
                onClick={() =>
                  go("contracts", { kind: "all", recipient: org.name })
                }
              >
                Search potential award matches <ArrowRight size={15} />
              </button>
            </>
          )}
        </aside>
      </div>
      <div className="source-caption">
        IRS public filings via{" "}
        <a href="https://projects.propublica.org/nonprofits/api">
          ProPublica Nonprofit Explorer
        </a>
        . Filing coverage and tax periods vary. This view does not automatically
        join officers, salaries, or inter-nonprofit grants.
      </div>
    </section>
  );
}
