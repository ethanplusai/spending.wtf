/**
 * Revenue vs Spending Screen — Dual time-series with deficit gap
 */

import { useState } from 'react';
import { SubScreenHeader } from '../SubScreenHeader';
import { ChartContainer, LinePath, AreaFill, Crosshair, Tooltip, GridLines } from '../charts';
import { linearScale, niceExtent } from '../../utils/chart';
import type { Point } from '../../utils/chart';
import { formatCurrency } from '../../utils/format';

interface RevenueVsSpendingScreenProps {
  onBack: () => void;
}

type Period = '5Y' | '10Y' | '20Y' | 'ALL';

const HISTORICAL_DATA = [
  { year: 2000, spending: 1.79e12, revenue: 2.03e12 },
  { year: 2001, spending: 1.86e12, revenue: 1.99e12 },
  { year: 2002, spending: 2.01e12, revenue: 1.85e12 },
  { year: 2003, spending: 2.16e12, revenue: 1.78e12 },
  { year: 2004, spending: 2.29e12, revenue: 1.88e12 },
  { year: 2005, spending: 2.47e12, revenue: 2.15e12 },
  { year: 2006, spending: 2.66e12, revenue: 2.41e12 },
  { year: 2007, spending: 2.73e12, revenue: 2.57e12 },
  { year: 2008, spending: 2.98e12, revenue: 2.52e12 },
  { year: 2009, spending: 3.52e12, revenue: 2.10e12 },
  { year: 2010, spending: 3.46e12, revenue: 2.16e12 },
  { year: 2011, spending: 3.60e12, revenue: 2.30e12 },
  { year: 2012, spending: 3.54e12, revenue: 2.45e12 },
  { year: 2013, spending: 3.45e12, revenue: 2.78e12 },
  { year: 2014, spending: 3.51e12, revenue: 3.02e12 },
  { year: 2015, spending: 3.69e12, revenue: 3.25e12 },
  { year: 2016, spending: 3.85e12, revenue: 3.27e12 },
  { year: 2017, spending: 3.98e12, revenue: 3.32e12 },
  { year: 2018, spending: 4.11e12, revenue: 3.33e12 },
  { year: 2019, spending: 4.45e12, revenue: 3.46e12 },
  { year: 2020, spending: 6.55e12, revenue: 3.42e12 },
  { year: 2021, spending: 6.82e12, revenue: 4.05e12 },
  { year: 2022, spending: 6.27e12, revenue: 4.90e12 },
  { year: 2023, spending: 6.13e12, revenue: 4.44e12 },
  { year: 2024, spending: 6.75e12, revenue: 4.92e12 },
  { year: 2025, spending: 7.0e12, revenue: 5.05e12 },
];

export function RevenueVsSpendingScreen({ onBack }: RevenueVsSpendingScreenProps) {
  const [period, setPeriod] = useState<Period>('ALL');

  const currentYear = new Date().getFullYear();
  const filtered = period === 'ALL' ? HISTORICAL_DATA
    : HISTORICAL_DATA.filter(d => d.year >= currentYear - parseInt(period));

  const latestDeficit = filtered.length > 0
    ? filtered[filtered.length - 1].spending - filtered[filtered.length - 1].revenue
    : 0;

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title="Revenue vs Spending" onBack={onBack} />
      <div className="screen-content">
        <div className="card" style={{ padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Current Annual Deficit</div>
          <div style={{ fontSize: '28px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--negative)', margin: '4px 0' }}>{formatCurrency(latestDeficit)}</div>
        </div>

        <div className="chart-time-selector" style={{ justifyContent: 'center', marginBottom: '12px' }}>
          {(['5Y', '10Y', '20Y', 'ALL'] as const).map(p => (
            <button
              key={p}
              className={`time-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: '12px' }}>
          <RevenueSpendingChart data={filtered} />
          <div className="chart-legend" style={{ marginTop: '8px' }}>
            <span className="legend-item"><span className="legend-indicator" style={{ background: '#10b981' }}></span>Revenue</span>
            <span className="legend-item"><span className="legend-indicator" style={{ background: '#ef4444' }}></span>Spending</span>
          </div>
        </div>

        {/* Deficit history */}
        <div className="section">
          <span className="section-title">Deficit by Year</span>
          <div className="card">
            {[...filtered].reverse().slice(0, 10).map((d, i, arr) => {
              const deficit = d.spending - d.revenue;
              const isSurplus = deficit < 0;
              return (
                <div key={d.year} className={`menu-item ${i < arr.length - 1 ? 'border-b' : ''}`} style={{ padding: '10px 16px' }}>
                  <span style={{ fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)', width: '40px' }}>{d.year}</span>
                  <div style={{ flex: 1, display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>{formatCurrency(d.revenue)}</span>
                    <span style={{ fontSize: '12px', color: '#ef4444' }}>{formatCurrency(d.spending)}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: isSurplus ? '#10b981' : '#ef4444' }}>
                    {isSurplus ? '+' : '-'}{formatCurrency(Math.abs(deficit))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueSpendingChart({ data }: { data: Array<{ year: number; spending: number; revenue: number }> }) {
  return (
    <ChartContainer
      height={250}
      margins={{ top: 15, right: 15, bottom: 25, left: 50 }}
      dataLength={data.length}
      ariaLabel="Revenue vs Spending over time"
    >
      {({ innerWidth, innerHeight, margins, isHovering, nearestIndex }) => {
        const allValues = data.flatMap(d => [d.spending, d.revenue]);
        const [yMin, yMax] = niceExtent(allValues, 0.05);
        const xScale = linearScale([0, data.length - 1], [margins.left, margins.left + innerWidth]);
        const yScale = linearScale([yMin, yMax], [margins.top + innerHeight, margins.top]);

        const spendingPoints: Point[] = data.map((d, i) => ({ x: xScale(i), y: yScale(d.spending) }));
        const revenuePoints: Point[] = data.map((d, i) => ({ x: xScale(i), y: yScale(d.revenue) }));

        const hovered = data[nearestIndex];
        const hSpend = spendingPoints[nearestIndex];
        const hRev = revenuePoints[nearestIndex];

        const labelStep = Math.max(1, Math.floor(data.length / 6));

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
              tickCount={5}
              format="currency"
            />

            {/* Deficit gap fill */}
            <AreaFill data={spendingPoints} baseline={margins.top + innerHeight} color="#ef4444" opacity={0.1} smooth />
            <AreaFill data={revenuePoints} baseline={margins.top + innerHeight} color="#10b981" opacity={0.1} smooth />

            <LinePath data={revenuePoints} color="#10b981" smooth strokeWidth={2} />
            <LinePath data={spendingPoints} color="#ef4444" smooth strokeWidth={2} />

            {/* X labels */}
            {data.filter((_, i) => i % labelStep === 0 || i === data.length - 1).map(d => {
              const idx = data.indexOf(d);
              return (
                <text key={d.year} x={xScale(idx)} y={margins.top + innerHeight + 16} className="chart-x-label" textAnchor="middle">
                  {d.year}
                </text>
              );
            })}

            {isHovering && hSpend && hRev && (
              <>
                <Crosshair x={hSpend.x} y={hSpend.y} top={margins.top} height={innerHeight} visible color="#ef4444" />
                <circle cx={hRev.x} cy={hRev.y} r={4} fill="#10b981" stroke="var(--bg-surface-1)" strokeWidth={2} style={{ pointerEvents: 'none' }} />
                <Tooltip x={hSpend.x} y={Math.min(hSpend.y, hRev.y)} visible containerWidth={margins.left + innerWidth + margins.right}>
                  <div className="chart-tooltip-value">{hovered.year}</div>
                  <div className="chart-tooltip-row" style={{ color: '#10b981' }}>Revenue: {formatCurrency(hovered.revenue)}</div>
                  <div className="chart-tooltip-row" style={{ color: '#ef4444' }}>Spending: {formatCurrency(hovered.spending)}</div>
                  <div className="chart-tooltip-row" style={{ color: '#ef4444', fontWeight: 400, fontFamily: 'var(--font-heading)' }}>
                    Deficit: {formatCurrency(hovered.spending - hovered.revenue)}
                  </div>
                </Tooltip>
              </>
            )}
          </>
        );
      }}
    </ChartContainer>
  );
}
