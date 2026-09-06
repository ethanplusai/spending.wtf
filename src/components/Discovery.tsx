import { useSnapshot } from "../environment";
import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import type { Page, Snapshot } from "../data";
import { money, readJSON } from "../data";
const paths: {
  n: string;
  title: string;
  text: string;
  page: Page;
  extra?: Record<string, string>;
}[] = [
  {
    n: "01",
    title: "Where does every dollar go?",
    text: "Social Security. Health care. Defense. Interest. Open the complete budget.",
    page: "budget",
  },
  {
    n: "02",
    title: "Who gets the grants?",
    text: "Follow health, research, infrastructure, and other assistance awards.",
    page: "contracts",
    extra: { kind: "grants" },
  },
  {
    n: "03",
    title: "Who is paying for this?",
    text: "Income taxes, corporate taxes, payroll receipts, and the financing gap.",
    page: "budget",
    extra: { tab: "revenue" },
  },
  {
    n: "04",
    title: "Follow an organization.",
    text: "Find recipients, open their awards, and save the evidence.",
    page: "atlas",
    extra: { dimension: "recipients" },
  },
  {
    n: "05",
    title: "How much goes overseas?",
    text: "Explore reported award obligations by where the work happens.",
    page: "atlas",
    extra: { dimension: "countries" },
  },
  {
    n: "06",
    title: "What comes back to my state?",
    text: "Compare federal grants, contracts, and benefit obligations close to home.",
    page: "places",
  },
];
export default function Discovery({
  go,
}: {
  go: (p: Page, extra?: Record<string, string>) => void;
}) {
  const [counts, setCounts] = useState<Record<string, number> | null>(
      useSnapshot<{ data: Record<string, number> }>("explore-all-counts")
        ?.data ?? null,
    ),
    [totals, setTotals] = useState<{ kind: string; amount: number }[]>(
      useSnapshot<{ kind: string; amount: number }[]>("discovery-totals") ?? [],
    );
  useEffect(() => {
    let active = true;
    fetch("/data/explore-all-counts.json")
      .then(readJSON<Snapshot<Record<string, number>>>)
      .then((j) => {
        if (active) setCounts(j.data);
      })
      .catch(() => {});
    Promise.all(
      ["grants", "contracts", "direct", "other"].map(async (kind) => {
        const j = await fetch(`/data/explore-${kind}-timeline.json`).then(
          readJSON<
            Snapshot<
              {
                time_period: { fiscal_year: string };
                aggregated_amount: number;
              }[]
            >
          >,
        );
        return {
          kind,
          amount: j.data.find((r) => r.time_period.fiscal_year === "2025")!
            .aggregated_amount,
        };
      }),
    )
      .then((j) => {
        if (active) setTotals(j);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="section discovery-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE NUMBER IS ONLY THE BEGINNING</span>
          <h2>A country’s worth of questions.</h2>
        </div>
        <p>Choose a thread. See where it leads.</p>
      </div>
      <div className="discovery-grid">
        {paths.map((p) => (
          <button key={p.n} onClick={() => go(p.page, p.extra)}>
            <span className="eyebrow">{p.n} / OPEN THE RECORD</span>
            <ArrowUpRight />
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </button>
        ))}
      </div>
      <div className="coverage-strip">
        <div>
          <span className="eyebrow">BEYOND A HANDFUL OF CONTRACTS</span>
          <strong>
            {counts
              ? (
                  Object.values(counts).reduce((a, b) => a + b, 0) / 1e6
                ).toFixed(1) + "M"
              : "The full record"}
          </strong>
          <p>
            Awards with activity in FY 2025, across non-loan types. Search the
            public source; starter records are examples.
          </p>
        </div>
        <div className="award-type-summary">
          {totals.map((t) => (
            <button
              key={t.kind}
              onClick={() => go("contracts", { kind: t.kind })}
            >
              <span>
                {t.kind === "direct"
                  ? "Direct payments"
                  : t.kind === "other"
                    ? "Other assistance"
                    : t.kind[0].toUpperCase() + t.kind.slice(1)}
              </span>
              <strong>{money(t.amount)}</strong>
              <small>FY 2025 net obligations</small>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
        <a href="https://www.usaspending.gov/" className="source-caption">
          USAspending · aggregate source queries · FY 2025 · obligations are not
          cash outlays ↗
        </a>
      </div>
    </section>
  );
}
