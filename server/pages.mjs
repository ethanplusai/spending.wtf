import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const json = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
export function installPages(app, root) {
  const site = new URL(process.env.PUBLIC_SITE_URL || "https://spending.wtf");
  if (!["https:", "http:"].includes(site.protocol))
    throw Error("PUBLIC_SITE_URL must be an HTTP(S) origin");
  const origin = site.origin;
  let bundle;
  const load = () =>
    (bundle ??= import(
      pathToFileURL(path.join(root, "dist/server/entry-server.js")).href
    ));
  app.get("/robots.txt", (req, res) =>
    res
      .type("text/plain")
      .send(
        `User-agent: *\nAllow: /\nDisallow: /notebook\nSitemap: ${origin}/sitemap.xml\n`,
      ),
  );
  app.get("/sitemap.xml", async (req, res, next) => {
    try {
      const { pageInfo } = await load();
      res.type("application/xml").send(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
          Object.keys(pageInfo)
            .filter((p) => p != "/notebook")
            .map((p) => `<url><loc>${escape(origin + p)}</loc></url>`)
            .join("") +
          "</urlset>",
      );
    } catch (e) {
      next(e);
    }
  });
  app.get("/taxes/race", (_, res) => res.redirect(308, "/taxes"));
  app.use("/server", (_, res) => res.status(404).end());
  app.use(
    express.static(path.join(root, "dist"), {
      index: false,
      setHeaders: (res, file) => {
        if (file.includes("/server/")) res.setHeader("X-Robots-Tag", "noindex");
      },
    }),
  );
  app.get("/{*path}", async (req, res, next) => {
    try {
      const { render, pageInfo, routes } = await load();
      const url = new URL(req.originalUrl, origin),
        legacy = url.searchParams.get("view");
      if (legacy && Object.hasOwn(routes, legacy)) {
        url.searchParams.delete("view");
        return res.redirect(
          308,
          routes[legacy] + (url.search ? "?" + url.searchParams : ""),
        );
      }
      if (url.pathname.length > 1 && url.pathname.endsWith("/"))
        return res.redirect(308, url.pathname.slice(0, -1) + url.search);
      const info = pageInfo[url.pathname];
      if (!info)
        return res
          .status(404)
          .type("html")
          .send(
            '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | spending.wtf</title><h1>Page not found</h1><p>This address does not identify a public ledger page.</p><a href="/">Open spending.wtf</a></html>',
          );
      const snapshots = {};
      const names = ["normalized", "debt"];
      if (url.pathname === "/") names.push("explore-all-counts");
      if (url.pathname === "/budget") names.push("fiscal-structure");
      if (url.pathname === "/states") names.push("explore-all-states");
      if (url.pathname === "/funding")
        names.push(
          "explore-all-" +
            ([
              "agencies",
              "recipients",
              "programs",
              "countries",
              "states",
            ].includes(url.searchParams.get("dimension"))
              ? url.searchParams.get("dimension")
              : "programs"),
        );
      if (url.pathname.startsWith("/taxes"))
        names.push("taxes", "corporate-taxes");
      for (const name of names)
        snapshots[name] = JSON.parse(
          fs.readFileSync(path.join(root, "dist/data", name + ".json"), "utf8"),
        );
      if (url.pathname === "/" || url.pathname === "/awards") {
        const kinds = ["grants", "contracts", "direct", "other"];
        if (url.pathname === "/") {
          snapshots["discovery-totals"] = kinds.map((kind) => {
            const j = JSON.parse(
              fs.readFileSync(
                path.join(root, "dist/data", `explore-${kind}-timeline.json`),
                "utf8",
              ),
            );
            return {
              kind,
              amount: j.data.find((r) => r.time_period.fiscal_year === "2025")
                .aggregated_amount,
            };
          });
        } else {
          const records = kinds.map((k) =>
            JSON.parse(
              fs.readFileSync(
                path.join(root, "dist/data", `explore-${k}-awards.json`),
                "utf8",
              ),
            ),
          );
          snapshots["starter-awards"] = Array.from({ length: 10 }, (_, i) =>
            records.map((j) => j.data[i]).filter(Boolean),
          ).flat();
          snapshots["starter-source"] =
            `Starter selection · 10 largest awards from each of four award types · FY 2025 · retrieved ${records[0].retrievedAt.slice(0, 10)} · search the full public record above`;
        }
      }
      // Same environment is serialized for hydration. No user-agent-dependent content.
      const renderURL = new URL(url);
      if (url.pathname.startsWith("/taxes/"))
        renderURL.searchParams.set("taxTab", url.pathname.split("/")[2]);
      const environment = {
        url: renderURL.pathname + renderURL.search,
        snapshots,
      };
      const canonical = origin + url.pathname;
      const filtered = url.searchParams.size > 0;
      const noindex =
        filtered ||
        url.pathname === "/notebook" ||
        req.hostname !== site.hostname;
      const graph = [
        {
          "@type": "WebSite",
          "@id": origin + "/#website",
          name: "spending.wtf",
          url: origin + "/",
          description: "Independent US public finance research.",
        },
        {
          "@type": "WebPage",
          "@id": canonical + "#page",
          url: canonical,
          name: info.title,
          description: info.description,
          isPartOf: { "@id": origin + "/#website" },
        },
        ...(url.pathname === "/"
          ? []
          : [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "spending.wtf",
                    item: origin + "/",
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: info.title,
                    item: canonical,
                  },
                ],
              },
            ]),
      ];
      if (info.dataset)
        graph.push({
          "@type": "Dataset",
          name: info.title,
          description:
            info.description +
            " See page for measurement scope, reporting periods and limitations.",
          url: canonical,
          creator: { "@type": "Organization", name: "spending.wtf" },
          isBasedOn: info.source,
          distribution: {
            "@type": "DataDownload",
            contentUrl: origin + "/data/" + info.dataset + ".json",
            encodingFormat: "application/json",
          },
          measurementTechnique:
            "Source-linked public data normalization; methods and limitations appear on the page.",
        });
      const metadata = `<meta name="description" content="${escape(info.description)}"/><link rel="canonical" href="${escape(canonical)}"/><meta name="robots" content="${noindex ? "noindex,follow" : "index,follow,max-image-preview:large"}"/><meta property="og:type" content="website"/><meta property="og:site_name" content="spending.wtf"/><meta property="og:title" content="${escape(info.title)}"/><meta property="og:description" content="${escape(info.description)}"/><meta property="og:url" content="${escape(canonical)}"/><meta property="og:image" content="${origin}/social-card.png"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escape(info.title)}"/><meta name="twitter:description" content="${escape(info.description)}"/><meta name="twitter:image" content="${origin}/social-card.png"/><script type="application/ld+json">${json({ "@context": "https://schema.org", "@graph": graph })}</script>`;
      let html = fs
        .readFileSync(
          fs.existsSync(path.join(root, "dist/server/page-template.html"))
            ? path.join(root, "dist/server/page-template.html")
            : path.join(root, "dist/index.html"),
          "utf8",
        )
        .replace(
          /<title>.*?<\/title>/,
          `<title>${escape(info.title)} | spending.wtf</title>`,
        )
        .replace(/<meta name="description"[^>]*\/>/, "");
      html = html
        .replace("</head>", metadata + "</head>")
        .replace(
          '<div id="root"></div>',
          `<div id="root">${render(environment)}</div><script id="ledger-bootstrap" type="application/json">${json(environment)}</script>`,
        );
      if (noindex) res.set("X-Robots-Tag", "noindex, follow");
      res.type("html").send(html);
    } catch (e) {
      next(e);
    }
  });
}
