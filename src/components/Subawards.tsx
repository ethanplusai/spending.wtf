import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { money, readJSON } from "../data";
import type { ExploreResult } from "../data";
type Row = {
  id: number;
  subaward_number: string;
  recipient_name: string;
  amount: number;
  action_date: string;
  description: string;
};
export default function Subawards({ awardId }: { awardId: string }) {
  const [result, setResult] = useState<ExploreResult<Row[]> | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [page, setPage] = useState(1);
  async function load(n = 1) {
    setLoading(true);
    setError("");
    try {
      const j = await fetch("/api/v1/subawards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awardId, page: n }),
      }).then(readJSON<ExploreResult<Row[]>>);
      setResult(j);
      setPage(n);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="subaward-section">
      <h3>Where did it go next?</h3>
      <p>
        Subawards reported beneath this prime award. These amounts are already
        nested within the prime funding; do not add them to its total.
      </p>
      {!result && (
        <button className="btn" disabled={loading} onClick={() => load()}>
          {loading ? "Loading…" : "Explore reported subawards"}
          <ArrowUpRight size={14} />
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <div className="source-caption">
            Retrieved {result.retrievedAt.slice(0, 10)} · USAspending · page{" "}
            {page}
          </div>
          {result.data.map((r) => (
            <details key={r.id}>
              <summary>
                {r.recipient_name} · {money(r.amount)}
              </summary>
              <p>
                {r.subaward_number} · {r.action_date}
              </p>
              <p>{r.description || "No description reported."}</p>
              <a
                className="text-link"
                href={`/awards?kind=all&recipient=${encodeURIComponent(r.recipient_name)}`}
              >
                Search this recipient’s prime awards ↗
              </a>
            </details>
          ))}
          {!result.data.length && (
            <p>
              No subawards reported in this response. Reporting thresholds and
              gaps apply.
            </p>
          )}
          <div className="pagination">
            <button
              className="btn"
              disabled={page === 1 || loading}
              onClick={() => load(page - 1)}
            >
              Previous
            </button>
            <button
              className="btn"
              disabled={!result.hasNext || loading}
              onClick={() => load(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
