/**
 * LinePath — Smooth or polyline SVG path
 */

import { linePath, smoothPath } from '../../utils/chart';
import type { Point } from '../../utils/chart';

interface LinePathProps {
  data: Point[];
  color?: string;
  strokeWidth?: number;
  smooth?: boolean;
  dashed?: boolean;
  animate?: boolean;
  className?: string;
}

export function LinePath({
  data,
  color = '#ef4444',
  strokeWidth = 2.5,
  smooth = true,
  dashed = false,
  animate = true,
  className = '',
}: LinePathProps) {
  if (data.length === 0) return null;

  const d = smooth ? smoothPath(data) : linePath(data);

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '6 4' : undefined}
      className={`chart-line-path ${animate ? 'chart-animate-path' : ''} ${className}`}
    />
  );
}
