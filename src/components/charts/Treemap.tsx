/**
 * Treemap — Squarified treemap visualization
 */

import { useState, useRef } from 'react';
import { squarify } from '../../utils/chart';
import type { TreemapItem } from '../../utils/chart';
import { useChartDimensions } from '../../hooks/useChartDimensions';
import { formatCurrency } from '../../utils/format';

interface TreemapProps {
  data: TreemapItem[];
  height?: number;
  onSelect?: (item: TreemapItem) => void;
}

export function Treemap({ data, height = 300, onSelect }: TreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dims = useChartDimensions(containerRef, { top: 0, right: 0, bottom: 0, left: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const rects = squarify(data, dims.width || 300, height);

  return (
    <div
      ref={containerRef}
      className="chart-container"
      style={{ minHeight: height, width: '100%' }}
    >
      <svg
        width={dims.width}
        height={height}
        viewBox={`0 0 ${dims.width} ${height}`}
        role="img"
        aria-label="Spending treemap"
      >
        {rects.map((rect, i) => {
          const isHovered = hoveredIndex === i;
          const textFits = rect.width > 50 && rect.height > 30;
          const valueFits = rect.width > 60 && rect.height > 45;

          return (
            <g
              key={rect.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelect?.(data[i])}
              style={{ cursor: onSelect ? 'pointer' : undefined }}
            >
              <rect
                x={rect.x + 1}
                y={rect.y + 1}
                width={Math.max(0, rect.width - 2)}
                height={Math.max(0, rect.height - 2)}
                fill={rect.color}
                rx={4}
                opacity={hoveredIndex === null ? 0.85 : isHovered ? 1 : 0.5}
                className="treemap-rect"
              />
              {textFits && (
                <text
                  x={rect.x + 8}
                  y={rect.y + 20}
                  className="treemap-label"
                  fill="white"
                  fontSize="11"
                  fontWeight="400"
                  fontFamily="var(--font-heading)"
                >
                  {rect.label.length > rect.width / 7 ? rect.label.slice(0, Math.floor(rect.width / 7)) + '...' : rect.label}
                </text>
              )}
              {valueFits && (
                <text
                  x={rect.x + 8}
                  y={rect.y + 36}
                  className="treemap-value"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="10"
                >
                  {formatCurrency(rect.value)}
                </text>
              )}

              {/* Tooltip on hover */}
              {isHovered && (
                <foreignObject
                  x={Math.min(rect.x + rect.width / 2, dims.width - 150)}
                  y={Math.max(0, rect.y - 50)}
                  width={140}
                  height={50}
                  style={{ pointerEvents: 'none', overflow: 'visible' }}
                >
                  <div className="chart-tooltip" style={{ fontSize: '12px' }}>
                    <div className="chart-tooltip-value">{rect.label}</div>
                    <div className="chart-tooltip-row">{formatCurrency(rect.value)}</div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
