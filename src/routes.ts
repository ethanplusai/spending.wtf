import type { Page } from "./data";
export const routes: Record<Page, string> = {
  overview: "/",
  budget: "/budget",
  contracts: "/awards",
  atlas: "/funding",
  history: "/debt",
  places: "/states",
  methodology: "/sources",
  organizations: "/nonprofits",
  saved: "/notebook",
  taxes: "/taxes",
};
export function pageFromURL(url: string): Page {
  const u = new URL(url, "https://spending.wtf");
  const legacy = u.searchParams.get("view");
  if (legacy && legacy in routes) return legacy as Page;
  return (
    (Object.entries(routes).find(
      ([, path]) => path === u.pathname,
    )?.[0] as Page) || (u.pathname.startsWith("/taxes/") ? "taxes" : "overview")
  );
}
export function pageURL(page: Page, extra: Record<string, string> = {}) {
  const q = new URLSearchParams(extra);
  return routes[page] + (q.size ? "?" + q : "");
}
