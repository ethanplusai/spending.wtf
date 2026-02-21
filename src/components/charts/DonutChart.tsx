/**
 * DonutChart — Interactive donut with hover highlight
 */

import { useState } from 'react';
import { formatCurrency } from '../../utils/format';

interface DonutSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  outerRadius?: number;
  innerRadius?: number;
  centerLabel?: string;
  centerValue?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function DonutChart({
  data,
  size = 200,
  outerRadius = 85,
  innerRadius = 55,
  centerLabel = 'Total Revenue',
  centerValue,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const cx = size / 2;
  const cy = size / 2;

  const total = data.reduce((s, d) => s + d.value, 0);
  const displayValue = centerValue ?? formatCurrency(total);

  let startAngle = -90;
  const slices = data.map(s => {
    const angle = (s.percent / 100) * 360;
    const start = startAngle;
    startAngle += angle;
    return { ...s, startAngle: start, endAngle: start + angle };
  });

  const hoveredSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Revenue breakdown donut chart"
      className="donut-chart"
    >
      {slices.map((s, i) => {
        const isHovered = hoveredIndex === i;
        const gap = 0.5;
        const outerArc = describeArc(cx, cy, outerRadius, s.startAngle, s.endAngle - gap);
        const innerArc = describeArc(cx, cy, innerRadius, s.endAngle - gap, s.startAngle);
        const outerEnd = polarToCartesian(cx, cy, outerRadius, s.endAngle - gap);
        const innerStart = polarToCartesian(cx, cy, innerRadius, s.endAngle - gap);
        const innerEnd = polarToCartesian(cx, cy, innerRadius, s.startAngle);
        const outerStart = polarToCartesian(cx, cy, outerRadius, s.startAngle);

        const d = `${outerArc} L ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} ${innerArc} L ${innerEnd.x} ${innerEnd.y} L ${outerStart.x} ${outerStart.y} Z`;

        return (
          <path
            key={i}
            d={d}
            fill={s.color}
            opacity={hoveredIndex === null ? 0.85 : isHovered ? 1 : 0.4}
            className="donut-segment"
            style={{
              transform: isHovered ? `scale(1.05)` : undefined,
              transformOrigin: `${cx}px ${cy}px`,
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        );
      })}

      {/* Center text */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="400" fontFamily="var(--font-heading)">
        {hoveredSlice ? formatCurrency(hoveredSlice.value) : displayValue}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
        {hoveredSlice ? hoveredSlice.label : centerLabel}
      </text>
      {hoveredSlice && (
        <text x={cx} y={cy + 24} textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
          {hoveredSlice.percent.toFixed(1)}%
        </text>
      )}
    </svg>
  );
}

function describeArc(cx: number, cy: number, r: number, startA: number, endA: number) {
  const s = polarToCartesian(cx, cy, r, startA);
  const e = polarToCartesian(cx, cy, r, endA);
  const largeArc = endA - startA > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}
