import http from "node:http";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../server/app.mjs";
// Use node:http so the production Host header is actually sent (fetch manages Host).
async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers: options.headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolve(
          new Response(Buffer.concat(chunks), {
            status: res.statusCode,
            headers: res.headers,
          }),
        ),
      );
    });
    req.on("error", reject);
  });
}
let server, base;
before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = "http://127.0.0.1:" + server.address().port;
});
after(() => new Promise((resolve) => server.close(resolve)));
test("All canonical pages contain server HTML, unique metadata and parseable structured data", async () => {
  const routes = [
    "/",
    "/budget",
    "/awards",
    "/funding",
    "/debt",
    "/states",
    "/sources",
    "/nonprofits",
    "/taxes",
    "/taxes/income",
    "/taxes/geography",
    "/taxes/corporations",
  ];
  const titles = new Set();
  for (const path of routes) {
    const r = await fetch(base + path, { headers: { host: "spending.wtf" } });
    assert.equal(r.status, 200, path);
    const html = await r.text();
    const body = html.split('<script id="ledger-bootstrap"')[0];
    assert.match(body, /<h1/);
    assert.doesNotMatch(body, /Opening the public ledger/);
    assert.match(
      html,
      new RegExp('rel="canonical" href="https://spending.wtf' + path + '"'),
    );
    assert.match(html, /index,follow,max-image-preview:large/);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titles.has(title));
    titles.add(title);
    const graph = JSON.parse(
      html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
    );
    assert.ok(graph["@graph"].some((x) => x["@type"] === "WebPage"));
    assert.match(html, /property="og:image"/);
    if (path === "/taxes/income") {
      assert.match(body, /38\.4/);
      assert.match(body, /675,602/);
    }
    if (path === "/taxes/corporations") assert.match(body, /Microsoft/);
    if (path === "/awards") assert.match(body, /Starter selection/);
  }
});
test("Legacy redirects preserve filters; unknown pages and server bundle do not become soft 404s", async () => {
  const r = await fetch(base + "/?view=contracts&state=NY", {
    redirect: "manual",
  });
  assert.equal(r.status, 308);
  assert.equal(r.headers.get("location"), "/awards?state=NY");
  assert.equal((await fetch(base + "/invented-page")).status, 404);
  assert.equal((await fetch(base + "/server/entry-server.js")).status, 404);
});
test("Private state, staging and filtered URLs are noindex; sitemap omits them", async () => {
  for (const p of ["/notebook", "/awards?state=NY"]) {
    const r = await fetch(base + p, { headers: { host: "spending.wtf" } });
    assert.match(r.headers.get("x-robots-tag"), /noindex/);
  }
  assert.match(
    (await fetch(base + "/taxes")).headers.get("x-robots-tag"),
    /noindex/,
  );
  const xml = await (await fetch(base + "/sitemap.xml")).text();
  assert.equal((xml.match(/<loc>/g) || []).length, 12);
  assert.doesNotMatch(xml, /notebook|\?view/);
  assert.match(xml, /taxes\/corporations/);
  assert.match(
    await (await fetch(base + "/robots.txt")).text(),
    /Sitemap: https:\/\/spending.wtf\/sitemap.xml/,
  );
});
test("Bootstrap escapes query text rather than creating script elements", async () => {
  const attack = "</script><script>alert(1)</script>";
  const html = await (
    await fetch(base + "/awards?q=" + encodeURIComponent(attack))
  ).text();
  assert.ok(!html.includes(attack));

  const env = JSON.parse(
    html.match(
      /id="ledger-bootstrap" type="application\/json">(.*?)<\/script>/s,
    )[1],
  );
  assert.equal(
    new URL(env.url, "https://spending.wtf").searchParams.get("q"),
    attack,
  );
});
