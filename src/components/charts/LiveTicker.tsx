/**
 * LiveTicker — Animated odometer-style number display
 */

import { useState, useEffect, useRef } from 'react';

interface LiveTickerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  incrementPerSecond?: number;
  precision?: number;
  showLive?: boolean;
}

export function LiveTicker({
  value,
  prefix = '$',
  suffix = '',
  incrementPerSecond = 0,
  precision = 0,
  showLive = false,
}: LiveTickerProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animRef = useRef<number>(0);

  // Animate to new target value
  useEffect(() => {
    const from = prevValueRef.current;
    const to = value;
    prevValueRef.current = value;

    if (from === to) return;

    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + (to - from) * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value]);

  // Live incrementing
  useEffect(() => {
    if (incrementPerSecond === 0) return;

    const interval = setInterval(() => {
      setDisplayValue(prev => prev + incrementPerSecond / 10);
    }, 100);

    return () => clearInterval(interval);
  }, [incrementPerSecond]);

  const formatted = formatTickerValue(displayValue, precision);

  return (
    <span className="live-ticker">
      {showLive && <span className="live-dot" />}
      <span className="live-ticker-value">
        {prefix}{formatted}{suffix}
      </span>
    </span>
  );
}

function formatTickerValue(num: number, precision: number): string {
  if (precision > 0) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  }
  return Math.round(num).toLocaleString('en-US');
}
