/**
 * Crosshair — Vertical tracking line + dot at data intersection
 */

interface CrosshairProps {
  x: number;
  y: number;
  top: number;
  height: number;
  color?: string;
  visible: boolean;
  dotRadius?: number;
}

export function Crosshair({
  x,
  y,
  top,
  height,
  color = '#ef4444',
  visible,
  dotRadius = 5,
}: CrosshairProps) {
  if (!visible) return null;

  return (
    <g className="crosshair-group" style={{ pointerEvents: 'none' }}>
      <line
        x1={x}
        y1={top}
        x2={x}
        y2={top + height}
        className="crosshair-line"
      />
      <circle
        cx={x}
        cy={y}
        r={dotRadius}
        fill={color}
        stroke="var(--bg-surface-1)"
        strokeWidth={2.5}
        className="crosshair-dot"
      />
    </g>
  );
}
