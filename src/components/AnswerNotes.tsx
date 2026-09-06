import { useContext, useEffect, useState } from "react";
import { EnvironmentContext } from "../environment";
import { pageInfo } from "../seo";
import { pageURL, pageFromURL } from "../routes";
export default function AnswerNotes({ route }: { route: string }) {
  const env = useContext(EnvironmentContext);
  const [url, setURL] = useState(env.url);
  useEffect(() => {
    const update = () => setURL(location.href);
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, [route]);
  const u = new URL(url, "https://spending.wtf");
  const info = pageInfo[u.pathname] ?? pageInfo[pageURL(pageFromURL(url))];
  useEffect(() => {
    document.title = info.title + " | spending.wtf";
    const canonical = document.querySelector('link[rel="canonical"]');
    const origin = canonical
      ? new URL(canonical.getAttribute("href")!).origin
      : "https://spending.wtf";
    const current = new URL(location.href),
      path = current.searchParams.has("view")
        ? pageURL(pageFromURL(current.href))
        : current.pathname;
    canonical?.setAttribute("href", origin + path);
    const values: Record<string, string> = {
      description: info.description,
      "og:title": info.title,
      "og:description": info.description,
      "og:url": origin + path,
      "twitter:title": info.title,
      "twitter:description": info.description,
      robots:
        current.searchParams.size ||
        path === "/notebook" ||
        location.hostname !== new URL(origin).hostname
          ? "noindex,follow"
          : "index,follow,max-image-preview:large",
    };
    for (const [key, value] of Object.entries(values)) {
      let tag = document.querySelector(
        `meta[${key.startsWith("og:") ? "property" : "name"}="${key}"]`,
      );
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(key.startsWith("og:") ? "property" : "name", key);
        document.head.append(tag);
      }
      tag.setAttribute("content", value);
    }
    const structured = document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (structured) {
      const graph = JSON.parse(structured.textContent || "{}");
      const page = graph["@graph"]?.find(
        (x: Record<string, unknown>) => x["@type"] === "WebPage",
      );
      if (page?.url !== origin + path) {
        structured.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              url: origin + path,
              name: info.title,
              description: info.description,
            },
            ...(info.dataset
              ? [
                  {
                    "@type": "Dataset",
                    name: info.title,
                    description: info.description,
                    url: origin + path,
                    isBasedOn: info.source,
                    distribution: {
                      "@type": "DataDownload",
                      contentUrl: origin + "/data/" + info.dataset + ".json",
                      encodingFormat: "application/json",
                    },
                  },
                ]
              : []),
          ],
        });
      }
    }
  }, [info, url]);
  return (
    <section className="answer-notes">
      <span className="eyebrow">A CLEAR ANSWER / FOLLOW THE SOURCE</span>
      <h2>{info.question}</h2>
      <p>{info.answer}</p>
      <a href={info.source}>Source & context ↗</a>
      <div className="answer-links">
        <a href="/budget">Federal budget</a>
        <a href="/taxes/income">Who pays income tax</a>
        <a href="/taxes/geography">Taxes by location</a>
        <a href="/awards">Awards</a>
        <a href="/sources">Sources</a>
      </div>
    </section>
  );
}
