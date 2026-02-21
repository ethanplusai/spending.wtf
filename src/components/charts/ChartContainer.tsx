/**
 * ChartContainer — SVG wrapper with ResizeObserver dimensions
 */

import { useRef } from 'react';
import { useChartDimensions } from '../../hooks/useChartDimensions';
import { useChartInteraction } from '../../hooks/useChartInteraction';

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ChartRenderProps {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margins: Margins;
  mouseX: number | null;
  mouseY: number | null;
  isHovering: boolean;
  nearestIndex: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

interface ChartContainerProps {
  height: number;
  margins?: Partial<Margins>;
  dataLength?: number;
  children: (props: ChartRenderProps) => React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function ChartContainer({
  height: minHeight,
  margins,
  dataLength = 0,
  children,
  className = '',
  ariaLabel,
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const dims = useChartDimensions(containerRef, margins);
  const interaction = useChartInteraction(svgRef, dims.innerWidth, dims.margins.left, dataLength);

  return (
    <div
      ref={containerRef}
      className={`chart-container ${className}`}
      style={{ minHeight, width: '100%', position: 'relative' }}
    >
      <svg
        ref={svgRef}
        width={dims.width}
        height={minHeight}
        viewBox={`0 0 ${dims.width} ${minHeight}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        style={{ overflow: 'visible', outline: 'none' }}
      >
        {dims.width > 0 && children({
          ...dims,
          height: minHeight,
          innerHeight: minHeight - dims.margins.top - dims.margins.bottom,
          ...interaction,
          svgRef,
        })}
      </svg>
    </div>
  );
}
