/**
 * Sparkline — Tiny inline chart for table rows
 */

import { smoothPath, linearScale } from '../../utils/chart';
import type { Point } from '../../utils/chart';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showEndDot?: boolean;
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = '#60a5fa',
  showEndDot = true,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const yScale = linearScale([min, max === min ? min + 1 : max], [height - 2, 2]);
  const xStep = width / (data.length - 1);

  const points: Point[] = data.map((v, i) => ({
    x: i * xStep,
    y: yScale(v),
  }));

  const d = smoothPath(points);
  const lastPoint = points[points.length - 1];

  // Determine trend color
  const trendColor = data[data.length - 1] >= data[0] ? '#ef4444' : '#10b981';
  const finalColor = color === '#60a5fa' ? trendColor : color;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline"
    >
      <path
        d={d}
        fill="none"
        stroke={finalColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        className="sparkline-path"
      />
      {showEndDot && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2}
          fill={finalColor}
        />
      )}
    </svg>
  );
}
