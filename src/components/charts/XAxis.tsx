/**
 * XAxis — Smart date/label formatting for horizontal axis
 */

interface XAxisProps {
  labels: string[];
  innerWidth: number;
  innerHeight: number;
  margins: { top: number; left: number };
  maxLabels?: number;
}

export function XAxis({
  labels,
  innerWidth,
  innerHeight,
  margins,
  maxLabels = 6,
}: XAxisProps) {
  const step = Math.max(1, Math.ceil(labels.length / maxLabels));
  const filteredLabels = labels.filter((_, i) =>
    i % step === 0 || i === labels.length - 1
  );

  return (
    <g className="chart-x-axis">
      {filteredLabels.map(label => {
        const idx = labels.indexOf(label);
        const x = margins.left + (idx / Math.max(labels.length - 1, 1)) * innerWidth;
        return (
          <text
            key={`${label}-${idx}`}
            x={x}
            y={margins.top + innerHeight + 16}
            className="chart-x-label"
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}
