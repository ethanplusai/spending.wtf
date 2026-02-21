/**
 * TimeRangeSelector — Period toggle buttons
 */

import type { TimePeriod } from '../../hooks/useTimeRange';

interface TimeRangeSelectorProps {
  periods?: TimePeriod[];
  activePeriod: string;
  onPeriodChange: (period: TimePeriod) => void;
}

const DEFAULT_PERIODS: TimePeriod[] = ['1Y', '5Y', '10Y', 'ALL'];

export function TimeRangeSelector({
  periods = DEFAULT_PERIODS,
  activePeriod,
  onPeriodChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="chart-time-selector">
      {periods.map(period => (
        <button
          key={period}
          className={`time-btn ${activePeriod === period ? 'active' : ''}`}
          onClick={() => onPeriodChange(period)}
        >
          {period}
        </button>
      ))}
    </div>
  );
}
