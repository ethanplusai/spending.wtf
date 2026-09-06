import { useEffect } from "react";
/** One-time reveals; native scrolling and reduced-motion preferences remain intact. */
export default function Motion({ route }: { route: string }) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            observer.unobserve(e.target);
          }
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px" },
    );
    const attach = () =>
      document
        .querySelectorAll(
          "#main .panel, #main .page-intro, #main .section-heading, #main .explore-paths, #main .fiscal-flow, #main .discovery-grid, #main .agency-workbench, #main .coverage-strip, #main .tax-intro, #main .tax-detail-grid, #main .tax-company-report",
        )
        .forEach((el) => {
          if (!el.classList.contains("reveal-ready")) {
            el.classList.add("reveal-ready");
            observer.observe(el);
          }
        });
    attach();
    const changes = new MutationObserver(attach);
    const main = document.getElementById("main");
    if (main) changes.observe(main, { childList: true, subtree: true });
    return () => {
      changes.disconnect();
      observer.disconnect();
      document
        .querySelectorAll(".reveal-ready")
        .forEach((el) => el.classList.remove("reveal-ready", "is-revealed"));
    };
  }, [route]);
  return null;
}
