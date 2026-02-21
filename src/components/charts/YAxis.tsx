/**
 * YAxis — Auto-formatted vertical axis labels
 */

import { generateTicks, formatTickLabel } from '../../utils/chart';

interface YAxisProps {
  min: number;
  max: number;
  innerHeight: number;
  margins: { top: number; left: number };
  tickCount?: number;
  format?: 'currency' | 'percent' | 'number';
}

export function YAxis({
  min,
  max,
  innerHeight,
  margins,
  tickCount = 5,
  format = 'currency',
}: YAxisProps) {
  const ticks = generateTicks(min, max, tickCount);
  const range = max - min || 1;

  return (
    <g className="chart-y-axis">
      {ticks.map(tick => {
        const y = margins.top + innerHeight - ((tick - min) / range) * innerHeight;
        if (y < margins.top - 5 || y > margins.top + innerHeight + 5) return null;
        return (
          <text
            key={tick}
            x={margins.left - 8}
            y={y + 4}
            className="chart-y-label"
            textAnchor="end"
          >
            {formatTickLabel(tick, format)}
          </text>
        );
      })}
    </g>
  );
}
