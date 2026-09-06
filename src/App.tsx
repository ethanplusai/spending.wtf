import { useContext, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { ArrowUpRight, Search, Menu, X, Bookmark, Check } from "lucide-react";
import type { Award, Data, Page } from "./data";

import { EnvironmentContext, type Environment } from "./environment";
import { pageFromURL, pageURL } from "./routes";
import Taxes from "./pages/Taxes";
import AnswerNotes from "./components/AnswerNotes";
import Motion from "./components/Motion";
import Overview from "./pages/Overview";
import Contracts from "./pages/Contracts";
import History from "./pages/History";
import Organizations from "./pages/Organizations";
import Budget from "./pages/Budget";
import Atlas from "./pages/Atlas";
import Places from "./pages/Places";
import Methodology from "./pages/Methodology";

const nav: [Page, string][] = [
  ["overview", "Overview"],
  ["budget", "The budget"],
  ["taxes", "Who pays"],
  ["contracts", "Awards"],
  ["atlas", "Funding atlas"],
  ["history", "Debt & the dollar"],
  ["places", "State & local"],
];

function AppContent() {
  const environment = useContext(EnvironmentContext);
  const [page, setPage] = useState<Page>(() => pageFromURL(environment.url)),
    [data, setData] = useState<Data | null>(
      (environment.snapshots.normalized as Data) ?? null,
    ),
    [failure, setFailure] = useState(""),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState(""),
    [saved, setSaved] = useState<Award[]>([]);
  useEffect(() => {
    // Restore browser-only state after hydration so saved records cannot change the server markup.
    try {
      const saved = JSON.parse(localStorage.getItem("ledger-saved") || "[]");
      if (Array.isArray(saved))
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSaved(
          saved.filter(
            (x) =>
              x &&
              typeof x.generated_internal_id === "string" &&
              typeof x["Award Amount"] === "number",
          ),
        );
    } catch {
      /* Storage unavailable. */
    }
    fetch("/data/normalized.json")
      .then((r) => {
        if (!r.ok) throw Error("Data could not be loaded");
        return r.json();
      })
      .then(setData)
      .catch((e) => setFailure(e.message));
    const fn = () => setPage(pageFromURL(location.href));
    window.addEventListener("popstate", fn);
    return () => window.removeEventListener("popstate", fn);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function go(p: Page, extra: Record<string, string> = {}) {
    history.pushState({}, "", pageURL(p, extra));
    setPage(p);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function save(a: Award) {
    const next = saved.some(
      (x) => x.generated_internal_id === a.generated_internal_id,
    )
      ? saved.filter((x) => x.generated_internal_id !== a.generated_internal_id)
      : [...saved, a];
    setSaved(next);
    try {
      localStorage.setItem("ledger-saved", JSON.stringify(next));
      setToast(
        next.length > saved.length
          ? "Award saved to your research notebook."
          : "Award removed from your notebook.",
      );
    } catch {
      setToast("Browser storage unavailable. Saved for this session only.");
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="utility">
        <span>An independent look at America’s finances.</span>
        <a href="/sources">
          Public data. Open methodology. <ArrowUpRight size={12} />
        </a>
      </div>
      <header>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go("overview");
          }}
          className="wordmark"
        >
          spending<span>.wtf</span>
        </a>
        <nav aria-label="Main navigation" className={mobile ? "open" : ""}>
          {nav.map(([p, label]) => (
            <a
              href={pageURL(p)}
              key={p}
              className={page === p ? "active" : ""}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                go(p);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-btn notebook"
            aria-label={`Research notebook, ${saved.length} saved awards`}
            onClick={() => go("saved")}
          >
            <Bookmark size={18} />
            {saved.length > 0 && <i>{saved.length}</i>}
          </button>
          <button className="research-btn" onClick={() => go("contracts")}>
            <Search size={15} /> Explore the data
          </button>
          <button
            className="icon-btn mobile-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <Motion route={page} />
      <main id="main">
        {failure ? (
          <div className="empty">
            <h1>We couldn’t load the ledger.</h1>
            <p>{failure}</p>
            <button className="btn" onClick={() => location.reload()}>
              Try again
            </button>
          </div>
        ) : !data ? (
          <div className="loading">
            <p>Opening the public ledger…</p>
          </div>
        ) : page === "overview" ? (
          <Overview data={data} go={go} />
        ) : page === "contracts" || page === "saved" ? (
          <Contracts
            key={page}
            saved={saved}
            save={save}
            notebook={page === "saved"}
            notify={setToast}
          />
        ) : page === "taxes" ? (
          <Taxes />
        ) : page === "budget" ? (
          <Budget go={go} data={data} />
        ) : page === "organizations" ? (
          <Organizations go={go} />
        ) : page === "atlas" ? (
          <Atlas go={go} />
        ) : page === "history" ? (
          <History data={data} />
        ) : page === "places" ? (
          <Places go={go} data={data} />
        ) : (
          <Methodology />
        )}
        <AnswerNotes route={page} />
      </main>
      <footer>
        <div>
          <a className="wordmark" href="/">
            spending<span>.wtf</span>
          </a>
          <p>A public ledger. A better-informed public.</p>
        </div>
        <div className="footer-links">
          <a href="/agents/README.md">
            Agent access · API & MCP <ArrowUpRight size={14} />
          </a>
          <a href="/sources">
            Sources & methodology <ArrowUpRight size={14} />
          </a>
          <a
            href="https://github.com/ethanplusai/spending.wtf"
            target="_blank"
            rel="noreferrer"
          >
            Open source <ArrowUpRight size={14} />
          </a>
          <span>Independent. No government affiliation.</span>
        </div>
        <div className="footer-bottom">
          <div className="footer-signoff">
            <span>Built for the people who pay for it.</span>
            <a
              className="footer-credit"
              href="https://ethanplus.ai"
              target="_blank"
              rel="noreferrer"
            >
              Built by Ethan
            </a>
          </div>
          <span>UNITED STATES · PUBLIC RECORD</span>
        </div>
      </footer>
      {toast && (
        <div role="status" className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </>
  );
}

export default function App({ environment }: { environment?: Environment }) {
  const value = environment ?? {
    url: typeof location === "undefined" ? "/" : location.href,
    snapshots: {},
  };
  return (
    <EnvironmentContext.Provider value={value}>
      <AppContent />
      <Analytics />
    </EnvironmentContext.Provider>
  );
}
