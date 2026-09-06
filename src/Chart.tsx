import { useEffect, useId, useRef, useState } from "react";
import { money } from "./data";
export type Point = {
  year: number;
  value: number;
  second?: number;
  label?: string;
};
export default function Chart({
  points,
  secondLabel = "Revenue",
  label = "Spending",
  percent = false,
  marker = false,
}: {
  points: Point[];
  secondLabel?: string;
  label?: string;
  percent?: boolean;
  marker?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(1000);
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(entries[0].contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const id = useId().replaceAll(":", ""),
    [hover, setHover] = useState<number | null>(null);
  const w = Math.max(280, width),
    h = width < 560 ? 240 : 300,
    l = 0,
    r = width < 560 ? 52 : 75,
    t = 25,
    b = 35;
  const max =
    Math.max(...points.flatMap((p) => [p.value, p.second ?? 0]), 1) * 1.12;
  const min =
    Math.min(...points.flatMap((p) => [p.value, p.second ?? 0]), 0) * 1.12;
  const x = (i: number) =>
      l + (i / Math.max(points.length - 1, 1)) * (w - l - r),
    y = (v: number) => t + (1 - (v - min) / (max - min)) * (h - t - b);
  const path = (key: "value" | "second") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key] ?? 0)}`).join(" ");
  const fmt = (n: number) => (percent ? `${n.toFixed(1)}%` : money(n, 1));
  const chosen = hover === null ? null : points[hover];
  if (!points.length)
    return (
      <div className="empty">
        No observations are available for this period.
      </div>
    );
  return (
    <div className="chart-wrap" ref={container}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="chart"
        role="img"
        aria-label={`${label} from ${points[0].label ?? points[0].year} to ${points.at(-1)?.label ?? points.at(-1)?.year}. ${points.length} observations. Use the data table for exact values.`}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f52c48" stopOpacity=".2" />
            <stop offset="100%" stopColor="#f52c48" stopOpacity=".01" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((k) => (
          <g key={k}>
            <line
              x1={l}
              x2={w - r + 8}
              y1={y(min + (max - min) * k)}
              y2={y(min + (max - min) * k)}
              stroke="#dedee3"
              strokeDasharray="3 5"
            />
            <text
              x={w - r + 20}
              y={y(min + (max - min) * k) + 4}
              className="svg-label"
            >
              {fmt(min + (max - min) * k)}
            </text>
          </g>
        ))}
        {marker && points[0].year <= 1971 && points.at(-1)!.year >= 1971 && (
          <g>
            <line
              x1={x(points.findIndex((p) => p.year >= 1971))}
              x2={x(points.findIndex((p) => p.year >= 1971))}
              y1={t}
              y2={h - b}
              stroke="#aaa58f"
              strokeDasharray="4 4"
            />
            <text
              x={x(points.findIndex((p) => p.year >= 1971)) + 8}
              y={t + 8}
              className="svg-label"
            >
              1971 · Gold window closes
            </text>
          </g>
        )}
        <path
          d={`${path("value")} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)}Z`}
          fill={`url(#${id})`}
        />
        <path
          d={path("value")}
          fill="none"
          stroke="#e5233c"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        {points.some((p) => p.second !== undefined) && (
          <path
            d={path("second")}
            fill="none"
            stroke="#687080"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={x(i) - (w - r) / Math.max(points.length - 1, 1) / 2}
              y={t}
              width={(w - r) / Math.max(points.length - 1, 1)}
              height={h - t - b}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
            />
            {(i === 0 ||
              i === points.length - 1 ||
              i %
                Math.max(
                  1,
                  Math.ceil(points.length / (width < 560 ? 4 : 7)),
                ) ===
                0) && (
              <text
                x={x(i)}
                y={h - 8}
                textAnchor={i === 0 ? "start" : "middle"}
                className="svg-label"
              >
                {p.label ?? p.year}
              </text>
            )}
          </g>
        ))}
        {chosen && hover !== null && (
          <g pointerEvents="none">
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={t}
              y2={h - b}
              stroke="#8c877a"
              strokeDasharray="4 4"
            />
            <circle
              cx={x(hover)}
              cy={y(chosen.value)}
              r="5"
              fill="#e5233c"
              stroke="#f8f7f2"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      <div className="chart-caption" aria-live="polite">
        {chosen ? (
          <>
            <strong>{chosen.label ?? chosen.year}</strong>
            <span>
              {label} {fmt(chosen.value)}
            </span>
            {chosen.second !== undefined && (
              <span>
                {secondLabel} {fmt(chosen.second)}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="legend red">{label}</span>
            {points.some((p) => p.second !== undefined) && (
              <span className="legend green">{secondLabel}</span>
            )}
            <span className="chart-hint">Move across the chart to inspect</span>
          </>
        )}
      </div>
    </div>
  );
}
