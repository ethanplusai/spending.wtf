/**
 * Interest Rates Screen — Treasury security rates + interest expense
 */

import { SubScreenHeader } from '../SubScreenHeader';
import { LoadingCard } from '../LoadingCard';
import { ErrorCard } from '../ErrorCard';
import { useApi } from '../../hooks/useApi';
import { fetchInterestRates, fetchInterestExpense } from '../../services/treasuryApi';
import { ChartContainer, BarGroup, Tooltip, LinePath, GridLines, Crosshair } from '../charts';
import { linearScale, niceExtent } from '../../utils/chart';
import type { Point } from '../../utils/chart';
import { formatCurrency } from '../../utils/format';
import { useState } from 'react';

interface InterestRatesScreenProps {
  onBack: () => void;
}

const RATE_COLORS: Record<string, string> = {
  'Treasury Bills': '#3b82f6',
  'Treasury Notes': '#10b981',
  'Treasury Bonds': '#f59e0b',
  'Treasury Inflation-Protected Securities': '#0ea5e9',
  'Federal Financing Bank': '#ef4444',
};

export function InterestRatesScreen({ onBack }: InterestRatesScreenProps) {
  const { data: rates, isLoading: ratesLoading, error: ratesError, refetch: refetchRates } = useApi(() => fetchInterestRates());
  const { data: expenses, isLoading: expLoading, error: expError, refetch: refetchExp } = useApi(() => fetchInterestExpense());
  const [hoveredRateIdx, setHoveredRateIdx] = useState<number | null>(null);

  const isLoading = ratesLoading || expLoading;
  const error = ratesError || expError;

  // Deduplicate rates by security type (API returns multiple rows)
  const uniqueRates = rates ? Array.from(
    rates.reduce((map, r) => {
      if (!map.has(r.type) && r.rate > 0) map.set(r.type, r);
      return map;
    }, new Map<string, { type: string; rate: number }>())
  ).map(([, v]) => v).slice(0, 6) : [];

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title="Interest Rates" onBack={onBack} />
      <div className="screen-content">
        {isLoading && <LoadingCard variant="chart" />}
        {error && <ErrorCard message={error} onRetry={() => { refetchRates(); refetchExp(); }} />}

        {/* Current Rates */}
        {uniqueRates.length > 0 && (
          <>
            <div className="card" style={{ padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Average Interest Rates</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>By Treasury Security Type</div>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              <ChartContainer
                height={160}
                margins={{ top: 15, right: 15, bottom: 40, left: 15 }}
                dataLength={uniqueRates.length}
                ariaLabel="Interest rates by security type"
              >
                {({ innerWidth, innerHeight, margins }) => {
                  const maxRate = Math.max(...uniqueRates.map(r => r.rate)) * 1.2;

                  const barData = uniqueRates.map(r => ({
                    label: r.type.replace('Treasury ', '').replace('Treasury Inflation-Protected Securities', 'TIPS').slice(0, 8),
                    values: [{ value: r.rate, color: RATE_COLORS[r.type] || '#60a5fa' }],
                  }));

                  return (
                    <>
                      <BarGroup
                        data={barData}
                        innerWidth={innerWidth}
                        innerHeight={innerHeight}
                        margins={margins}
                        maxValue={maxRate}
                        hoveredIndex={hoveredRateIdx}
                        onHover={setHoveredRateIdx}
                        animate
                      />
                      {hoveredRateIdx !== null && hoveredRateIdx < uniqueRates.length && (
                        <Tooltip
                          x={margins.left + (hoveredRateIdx / uniqueRates.length) * innerWidth + innerWidth / uniqueRates.length / 2}
                          y={margins.top}
                          visible
                          containerWidth={margins.left + innerWidth + margins.right}
                        >
                          <div className="chart-tooltip-value">{uniqueRates[hoveredRateIdx].type}</div>
                          <div className="chart-tooltip-row">{uniqueRates[hoveredRateIdx].rate.toFixed(3)}%</div>
                        </Tooltip>
                      )}
                    </>
                  );
                }}
              </ChartContainer>
            </div>

            {/* Rate list */}
            <div className="section">
              <span className="section-title">Rates by Security</span>
              <div className="card">
                {uniqueRates.map((r, i) => (
                  <div key={r.type} className={`menu-item ${i < uniqueRates.length - 1 ? 'border-b' : ''}`} style={{ padding: '12px 16px' }}>
                    <div className="menu-item-info" style={{ flex: 1, gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: RATE_COLORS[r.type] || '#60a5fa', flexShrink: 0 }} />
                      <span className="menu-item-label" style={{ fontSize: '13px' }}>{r.type}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                      {r.rate.toFixed(3)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Interest Expense Over Time */}
        {expenses && expenses.length > 0 && (
          <div className="section">
            <span className="section-title">Interest Expense Trend</span>
            <div className="card" style={{ padding: '12px' }}>
              <InterestExpenseChart data={expenses} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InterestExpenseChart({ data }: { data: Array<{ year: number; amount: number }> }) {
  return (
    <ChartContainer
      height={180}
      margins={{ top: 15, right: 15, bottom: 25, left: 50 }}
      dataLength={data.length}
      ariaLabel="Interest expense over time"
    >
      {({ innerWidth, innerHeight, margins, isHovering, nearestIndex }) => {
        const amounts = data.map(d => d.amount);
        const [yMin, yMax] = niceExtent(amounts, 0.05);
        const xScale = linearScale([0, data.length - 1], [margins.left, margins.left + innerWidth]);
        const yScale = linearScale([yMin, yMax], [margins.top + innerHeight, margins.top]);

        const points: Point[] = data.map((d, i) => ({
          x: xScale(i),
          y: yScale(d.amount),
        }));

        const hovered = data[nearestIndex];
        const hoveredPoint = points[nearestIndex];
        const labelStep = Math.max(1, Math.floor(data.length / 5));

        return (
          <>
            <GridLines
              orientation="horizontal"
              yMin={yMin}
              yMax={yMax}
              innerWidth={innerWidth}
              innerHeight={innerHeight}
              margins={margins}
              yScale={yScale}
              tickCount={4}
              format="currency"
            />
            <LinePath data={points} color="#f59e0b" smooth strokeWidth={2} />

            {data.filter((_, i) => i % labelStep === 0 || i === data.length - 1).map(d => {
              const idx = data.indexOf(d);
              return (
                <text key={d.year} x={xScale(idx)} y={margins.top + innerHeight + 16} className="chart-x-label" textAnchor="middle">
                  {d.year}
                </text>
              );
            })}

            {isHovering && hoveredPoint && (
              <>
                <Crosshair x={hoveredPoint.x} y={hoveredPoint.y} top={margins.top} height={innerHeight} visible color="#f59e0b" />
                <Tooltip x={hoveredPoint.x} y={hoveredPoint.y} visible containerWidth={margins.left + innerWidth + margins.right}>
                  <div className="chart-tooltip-value">{hovered.year}</div>
                  <div className="chart-tooltip-row">{formatCurrency(hovered.amount)}</div>
                </Tooltip>
              </>
            )}
          </>
        );
      }}
    </ChartContainer>
  );
}
