/**
 * useTimeRange — Period filtering + LTTB decimation for time-series charts
 */

import { useState, useMemo } from 'react';
import { lttbDecimate } from '../utils/chart';
import type { Point } from '../utils/chart';

export type TimePeriod = '1M' | '3M' | '6M' | '1Y' | '5Y' | '10Y' | 'YTD' | 'ALL';

interface TimeRangeResult<T> {
  filteredData: T[];
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
}

export function useTimeRange<T extends { date?: string; year?: number }>(
  data: T[],
  initialPeriod: TimePeriod = 'ALL'
): TimeRangeResult<T> {
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);

  const filteredData = useMemo(() => {
    if (period === 'ALL' || data.length === 0) return data;

    const now = new Date();
    let cutoff: Date;

    switch (period) {
      case '1M':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3M':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6M':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1Y':
        cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case '5Y':
        cutoff = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        break;
      case '10Y':
        cutoff = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
        break;
      case 'YTD':
        cutoff = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return data;
    }

    const cutoffYear = cutoff.getFullYear();

    return data.filter(d => {
      if (d.date) {
        const itemDate = new Date(d.date);
        return itemDate >= cutoff;
      }
      if (d.year !== undefined) {
        return d.year >= cutoffYear;
      }
      return true;
    });
  }, [data, period]);

  return { filteredData, period, setPeriod };
}

/**
 * Decimate point data when it exceeds a threshold
 */
export function decimateIfNeeded(points: Point[], threshold = 100): Point[] {
  if (points.length <= threshold) return points;
  return lttbDecimate(points, threshold);
}
