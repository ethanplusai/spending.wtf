/**
 * GridLines — Reference lines for charts
 */

import { generateTicks, formatTickLabel } from '../../utils/chart';

interface GridLinesProps {
  orientation: 'horizontal' | 'vertical' | 'both';
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  innerWidth: number;
  innerHeight: number;
  margins: { top: number; left: number };
  xScale?: (v: number) => number;
  yScale?: (v: number) => number;
  tickCount?: number;
  format?: 'currency' | 'percent' | 'number';
  showLabels?: boolean;
}

export function GridLines({
  orientation,
  xMin = 0,
  xMax = 1,
  yMin = 0,
  yMax = 1,
  innerWidth,
  innerHeight,
  margins,
  xScale,
  yScale,
  tickCount = 5,
  format = 'currency',
  showLabels = true,
}: GridLinesProps) {
  const showH = orientation === 'horizontal' || orientation === 'both';
  const showV = orientation === 'vertical' || orientation === 'both';

  const hTicks = showH ? generateTicks(yMin, yMax, tickCount) : [];
  const vTicks = showV ? generateTicks(xMin, xMax, tickCount) : [];

  return (
    <g className="chart-grid">
      {hTicks.map((tick) => {
        const y = yScale ? yScale(tick) : margins.top + innerHeight - ((tick - yMin) / (yMax - yMin || 1)) * innerHeight;
        if (y < margins.top - 1 || y > margins.top + innerHeight + 1) return null;
        return (
          <g key={`h-${tick}`}>
            <line
              x1={margins.left}
              y1={y}
              x2={margins.left + innerWidth}
              y2={y}
              className="chart-grid-line"
            />
            {showLabels && (
              <text
                x={margins.left - 8}
                y={y + 4}
                className="chart-y-label"
                textAnchor="end"
              >
                {formatTickLabel(tick, format)}
              </text>
            )}
          </g>
        );
      })}
      {vTicks.map((tick) => {
        const x = xScale ? xScale(tick) : margins.left + ((tick - xMin) / (xMax - xMin || 1)) * innerWidth;
        if (x < margins.left - 1 || x > margins.left + innerWidth + 1) return null;
        return (
          <line
            key={`v-${tick}`}
            x1={x}
            y1={margins.top}
            x2={x}
            y2={margins.top + innerHeight}
            className="chart-grid-line"
          />
        );
      })}
    </g>
  );
}
