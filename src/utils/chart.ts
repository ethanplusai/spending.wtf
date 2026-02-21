/**
 * Chart Utilities — spending.wtf
 * Pure functions: scales, path generators, treemap, data processing, ticks
 */

// ============================================
// Scale Functions
// ============================================

export function linearScale(
  domain: [number, number],
  range: [number, number]
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const dSpan = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / dSpan) * (r1 - r0);
}

export function bandScale(
  labels: string[],
  range: [number, number],
  padding = 0.2
): { scale: (label: string) => number; bandwidth: number } {
  const [r0, r1] = range;
  const n = labels.length;
  const totalPadding = padding * (n + 1);
  const bandwidth = (r1 - r0 - totalPadding * ((r1 - r0) / (n + totalPadding))) / n;
  const step = bandwidth + padding * bandwidth / (1 - padding);
  const offset = (r1 - r0 - step * n + (step - bandwidth)) / 2;

  const map = new Map<string, number>();
  labels.forEach((label, i) => {
    map.set(label, r0 + offset + i * step);
  });

  return {
    scale: (label: string) => map.get(label) ?? r0,
    bandwidth,
  };
}

export function niceExtent(values: number[], padding = 0.1): [number, number] {
  if (values.length === 0) return [0, 1];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min = min > 0 ? 0 : min - 1;
    max = max > 0 ? max + 1 : 0;
  }
  const range = max - min;
  const padded = range * padding;
  const niceMin = min > 0 ? Math.max(0, min - padded) : min - padded;
  const niceMax = max + padded;
  return [niceMin, niceMax];
}

// ============================================
// Path Generators
// ============================================

export interface Point {
  x: number;
  y: number;
}

export function linePath(points: Point[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

/**
 * Monotone cubic spline (Fritsch-Carlson)
 * Produces smooth paths that preserve monotonicity
 */
export function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  const n = points.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const slopes: number[] = [];
  const tangents: number[] = new Array(n);

  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    dy.push(points[i + 1].y - points[i].y);
    slopes.push(dx[i] === 0 ? 0 : dy[i] / dx[i]);
  }

  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (slopes[i - 1] + slopes[i]) / 2;
    }
  }

  // Fritsch-Carlson monotonicity adjustment
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slopes[i]) < 1e-10) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / slopes[i];
      const beta = tangents[i + 1] / slopes[i];
      const s = alpha * alpha + beta * beta;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        tangents[i] = t * alpha * slopes[i];
        tangents[i + 1] = t * beta * slopes[i];
      }
    }
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const cp1x = points[i].x + dx[i] / 3;
    const cp1y = points[i].y + tangents[i] * dx[i] / 3;
    const cp2x = points[i + 1].x - dx[i] / 3;
    const cp2y = points[i + 1].y - tangents[i + 1] * dx[i] / 3;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }

  return d;
}

export function areaPath(points: Point[], baseline: number): string {
  if (points.length === 0) return '';
  const line = linePath(points);
  return `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
}

export function smoothAreaPath(points: Point[], baseline: number): string {
  if (points.length === 0) return '';
  const line = smoothPath(points);
  return `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
}

// ============================================
// Treemap (Squarified)
// ============================================

export interface TreemapItem {
  label: string;
  value: number;
  color: string;
  extra?: Record<string, unknown>;
}

export interface TreemapRect {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  value: number;
  color: string;
  extra?: Record<string, unknown>;
}

export function squarify(data: TreemapItem[], width: number, height: number): TreemapRect[] {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return [];

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const normalized = sorted.map(d => ({
    ...d,
    area: (d.value / total) * width * height,
  }));

  const rects: TreemapRect[] = [];

  function layoutRow(
    items: typeof normalized,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    if (items.length === 0) return;
    if (items.length === 1) {
      rects.push({
        x, y,
        width: Math.max(0, w),
        height: Math.max(0, h),
        label: items[0].label,
        value: items[0].value,
        color: items[0].color,
        extra: items[0].extra,
      });
      return;
    }

    const isWide = w >= h;

    let row: typeof normalized = [];
    let remaining = [...items];
    let bestAspect = Infinity;

    for (let i = 0; i < items.length; i++) {
      const candidate = [...row, items[i]];
      const candidateArea = candidate.reduce((s, it) => s + it.area, 0);

      let rowLength: number;
      if (isWide) {
        rowLength = candidateArea / h;
      } else {
        rowLength = candidateArea / w;
      }

      let worstAspect = 0;
      for (const c of candidate) {
        const cellSize = isWide ? c.area / rowLength : c.area / rowLength;
        const aspect = isWide
          ? Math.max(rowLength / (cellSize || 1), (cellSize || 1) / rowLength)
          : Math.max(rowLength / (cellSize || 1), (cellSize || 1) / rowLength);
        worstAspect = Math.max(worstAspect, aspect);
      }

      if (worstAspect <= bestAspect) {
        bestAspect = worstAspect;
        row = candidate;
        remaining = items.slice(i + 1);
      } else {
        break;
      }
    }

    const rowArea = row.reduce((s, it) => s + it.area, 0);
    let offset = 0;

    if (isWide) {
      const rowWidth = rowArea / h;
      for (const item of row) {
        const cellHeight = item.area / rowWidth;
        rects.push({
          x: x + offset * 0, // row is laid out vertically within the column
          y: y + offset,
          width: Math.max(0, rowWidth),
          height: Math.max(0, cellHeight),
          label: item.label,
          value: item.value,
          color: item.color,
          extra: item.extra,
        });
        offset += cellHeight;
      }
      layoutRow(remaining, x + rowWidth, y, w - rowWidth, h);
    } else {
      const rowHeight = rowArea / w;
      for (const item of row) {
        const cellWidth = item.area / rowHeight;
        rects.push({
          x: x + offset,
          y,
          width: Math.max(0, cellWidth),
          height: Math.max(0, rowHeight),
          label: item.label,
          value: item.value,
          color: item.color,
          extra: item.extra,
        });
        offset += cellWidth;
      }
      layoutRow(remaining, x, y + rowHeight, w, h - rowHeight);
    }
  }

  layoutRow(normalized, 0, 0, width, height);
  return rects;
}

// ============================================
// Data Processing
// ============================================

/**
 * Largest-Triangle-Three-Buckets downsampling
 * Reduces a dataset to targetPoints while preserving visual shape
 */
export function lttbDecimate(
  data: Point[],
  targetPoints: number
): Point[] {
  if (data.length <= targetPoints) return data;
  if (targetPoints < 3) return [data[0], data[data.length - 1]];

  const result: Point[] = [data[0]];
  const bucketSize = (data.length - 2) / (targetPoints - 2);

  let lastSelected = 0;

  for (let i = 0; i < targetPoints - 2; i++) {
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length - 1);

    // Average of next bucket for reference
    let avgX = 0;
    let avgY = 0;
    const nextBucketStart = Math.floor((i + 2) * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, data.length - 1);
    const nextCount = nextBucketEnd - nextBucketStart;
    if (nextCount > 0) {
      for (let j = nextBucketStart; j < nextBucketEnd; j++) {
        avgX += data[j].x;
        avgY += data[j].y;
      }
      avgX /= nextCount;
      avgY /= nextCount;
    } else {
      avgX = data[data.length - 1].x;
      avgY = data[data.length - 1].y;
    }

    let maxArea = -1;
    let maxIdx = bucketStart;

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (data[lastSelected].x - avgX) * (data[j].y - data[lastSelected].y) -
        (data[lastSelected].x - data[j].x) * (avgY - data[lastSelected].y)
      );
      if (area > maxArea) {
        maxArea = area;
        maxIdx = j;
      }
    }

    result.push(data[maxIdx]);
    lastSelected = maxIdx;
  }

  result.push(data[data.length - 1]);
  return result;
}

export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.ceil(window / 2));
    let sum = 0;
    for (let j = start; j < end; j++) sum += values[j];
    result.push(sum / (end - start));
  }
  return result;
}

export function percentChange(values: number[]): number[] {
  if (values.length < 2) return [];
  return values.slice(1).map((v, i) => {
    const prev = values[i];
    return prev === 0 ? 0 : ((v - prev) / Math.abs(prev)) * 100;
  });
}

// ============================================
// Tick Generation
// ============================================

export function generateTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const range = max - min;
  const roughStep = range / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;

  let step: number;
  if (normalized <= 1.5) step = magnitude;
  else if (normalized <= 3) step = 2 * magnitude;
  else if (normalized <= 7) step = 5 * magnitude;
  else step = 10 * magnitude;

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.01; v += step) {
    ticks.push(v);
  }
  return ticks;
}

export function formatTickLabel(value: number, format: 'currency' | 'percent' | 'number' = 'currency'): string {
  if (format === 'percent') return `${value.toFixed(0)}%`;
  if (format === 'number') {
    if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(0)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toFixed(0);
  }
  // currency
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  if (value === 0) return '$0';
  return `$${value.toFixed(0)}`;
}
