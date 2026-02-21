/**
 * AreaFill — Gradient area under a line
 */

import { useId } from 'react';
import { smoothAreaPath, areaPath } from '../../utils/chart';
import type { Point } from '../../utils/chart';

interface AreaFillProps {
  data: Point[];
  baseline: number;
  color?: string;
  opacity?: number;
  smooth?: boolean;
  animate?: boolean;
}

export function AreaFill({
  data,
  baseline,
  color = '#ef4444',
  opacity = 0.25,
  smooth = true,
  animate = true,
}: AreaFillProps) {
  const gradientId = useId();

  if (data.length === 0) return null;

  const d = smooth ? smoothAreaPath(data, baseline) : areaPath(data, baseline);

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill={`url(#${gradientId})`}
        className={animate ? 'chart-animate-fade' : ''}
      />
    </>
  );
}
