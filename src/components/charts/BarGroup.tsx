/**
 * BarGroup — Vertical bars with hover effects
 */

interface BarData {
  label: string;
  values: Array<{ value: number; color: string; label?: string }>;
}

interface BarGroupProps {
  data: BarData[];
  innerWidth: number;
  innerHeight: number;
  margins: { top: number; left: number };
  maxValue?: number;
  barRadius?: number;
  hoveredIndex?: number | null;
  animate?: boolean;
  showLabels?: boolean;
  onHover?: (index: number | null) => void;
}

export function BarGroup({
  data,
  innerWidth,
  innerHeight,
  margins,
  maxValue: maxValProp,
  barRadius = 3,
  hoveredIndex,
  animate = true,
  showLabels = true,
  onHover,
}: BarGroupProps) {
  const allValues = data.flatMap(d => d.values.map(v => v.value));
  const maxVal = maxValProp ?? Math.max(...allValues) * 1.1;
  if (maxVal === 0) return null;

  const groupCount = data.length;
  const groupWidth = innerWidth / groupCount;
  const gap = Math.max(2, groupWidth * 0.15);
  const usableGroupWidth = groupWidth - gap;

  return (
    <g>
      {data.map((group, gi) => {
        const barsPerGroup = group.values.length;
        const barGap = barsPerGroup > 1 ? 3 : 0;
        const barWidth = Math.max(4, (usableGroupWidth - barGap * (barsPerGroup - 1)) / barsPerGroup);
        const groupX = margins.left + gi * groupWidth + gap / 2;
        const isDimmed = hoveredIndex !== null && hoveredIndex !== undefined && hoveredIndex !== gi;

        return (
          <g
            key={group.label}
            onMouseEnter={() => onHover?.(gi)}
            onMouseLeave={() => onHover?.(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Invisible hit area */}
            <rect
              x={groupX}
              y={margins.top}
              width={usableGroupWidth}
              height={innerHeight}
              fill="transparent"
            />
            {group.values.map((bar, bi) => {
              const barHeight = (bar.value / maxVal) * innerHeight;
              const x = groupX + bi * (barWidth + barGap);
              const y = margins.top + innerHeight - barHeight;

              return (
                <rect
                  key={bi}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(0, barHeight)}
                  fill={bar.color}
                  rx={barRadius}
                  className={`chart-bar ${isDimmed ? 'dimmed' : ''} ${animate ? 'chart-bar-animate' : ''}`}
                />
              );
            })}
            {showLabels && (
              <text
                x={groupX + usableGroupWidth / 2}
                y={margins.top + innerHeight + 16}
                className="chart-x-label"
                textAnchor="middle"
              >
                {group.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
