/**
 * useChartDimensions — ResizeObserver-based responsive chart sizing
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ChartDimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margins: Margins;
}

const DEFAULT_MARGINS: Margins = { top: 20, right: 20, bottom: 30, left: 50 };

export function useChartDimensions(
  containerRef: React.RefObject<HTMLDivElement | null>,
  margins: Partial<Margins> = {}
): ChartDimensions {
  const mergedMargins = { ...DEFAULT_MARGINS, ...margins };
  const [size, setSize] = useState({ width: 300, height: 200 });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    }, 100);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(handleResize);
    observer.observe(el);

    // Initial measurement
    const rect = el.getBoundingClientRect();
    setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [containerRef, handleResize]);

  return {
    width: size.width,
    height: size.height,
    innerWidth: Math.max(0, size.width - mergedMargins.left - mergedMargins.right),
    innerHeight: Math.max(0, size.height - mergedMargins.top - mergedMargins.bottom),
    margins: mergedMargins,
  };
}
