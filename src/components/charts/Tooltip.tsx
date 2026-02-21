/**
 * Tooltip — Floating glassmorphism card near crosshair
 */

interface TooltipProps {
  x: number;
  y: number;
  visible: boolean;
  containerWidth: number;
  children: React.ReactNode;
}

export function Tooltip({ x, y, visible, containerWidth, children }: TooltipProps) {
  if (!visible) return null;

  // Flip to left side if near right edge
  const tooltipWidth = 160;
  const isRight = x + tooltipWidth + 20 > containerWidth;
  const tx = isRight ? x - tooltipWidth - 12 : x + 12;
  const ty = Math.max(10, y - 20);

  return (
    <foreignObject
      x={tx}
      y={ty}
      width={tooltipWidth}
      height={100}
      style={{ pointerEvents: 'none', overflow: 'visible' }}
    >
      <div className="chart-tooltip">
        {children}
      </div>
    </foreignObject>
  );
}
