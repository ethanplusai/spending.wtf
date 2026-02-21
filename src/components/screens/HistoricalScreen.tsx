/**
 * Historical Screen — Long-term national debt chart with interactive crosshair
 */

import { useState } from 'react';
import { SubScreenHeader } from '../SubScreenHeader';
import { LoadingCard } from '../LoadingCard';
import { ErrorCard } from '../ErrorCard';
import { useApi } from '../../hooks/useApi';
import { fetchHistoricalDebt } from '../../services/treasuryApi';
import { formatCurrency } from '../../utils/format';
import { ChartContainer, LinePath, AreaFill, Crosshair, Tooltip, GridLines } from '../charts';
import { linearScale, niceExtent } from '../../utils/chart';
import type { Point } from '../../utils/chart';

interface HistoricalScreenProps {
  onBack: () => void;
}

type TimePeriod = '10y' | '20y' | '50y' | 'all';

const MILESTONES: Record<number, string> = {
  1835: 'Debt paid off',
  1917: 'WWI',
  1942: 'WWII',
  2001: '9/11 & War on Terror',
  2008: 'Financial Crisis',
  2020: 'COVID-19',
};

export function HistoricalScreen({ onBack }: HistoricalScreenProps) {
  const [period, setPeriod] = useState<TimePeriod>('all');

  const startYear = period === '10y' ? new Date().getFullYear() - 10
    : period === '20y' ? new Date().getFullYear() - 20
    : period === '50y' ? new Date().getFullYear() - 50
    : undefined;

  const { data, isLoading, error, refetch } = useApi(
    () => fetchHistoricalDebt(startYear),
    [startYear]
  );

  const chartData = data || [];

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title="Historical Debt" onBack={onBack} />
      <div className="screen-content">
        {/* Period selector */}
        <div className="chart-time-selector" style={{ margin: '0 0 12px', justifyContent: 'center' }}>
          {(['10y', '20y', '50y', 'all'] as const).map(p => (
            <button
              key={p}
              className={`time-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All' : p.toUpperCase()}
            </button>
          ))}
        </div>

        {isLoading && <LoadingCard variant="chart" />}
        {error && <ErrorCard message={error} onRetry={refetch} />}

        {chartData.length > 0 && (
          <>
            {/* Interactive SVG Chart */}
            <div className="card" style={{ padding: '16px' }}>
              <HistoricalDebtChart data={chartData} />
            </div>

            {/* Milestones */}
            <div className="section">
              <span className="section-title">Key Milestones</span>
              <div className="card">
                {chartData
                  .filter(d => {
                    const year = parseInt(d.date);
                    return MILESTONES[year];
                  })
                  .map((d, i, arr) => {
                    const year = parseInt(d.date);
                    return (
                      <div key={year} className={`menu-item ${i < arr.length - 1 ? 'border-b' : ''}`}>
                        <div className="menu-item-info">
                          <span style={{ fontWeight: 400, fontFamily: 'var(--font-heading)', width: '48px', color: 'var(--text-muted)', fontSize: '13px' }}>{year}</span>
                          <span className="menu-item-label">{MILESTONES[year]}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                          {formatCurrency(d.debt)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Summary stats */}
            {chartData.length >= 2 && (
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Earliest</div>
                    <div style={{ fontSize: '15px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{formatCurrency(chartData[0].debt)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{chartData[0].date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Latest</div>
                    <div style={{ fontSize: '15px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: '#ef4444' }}>{formatCurrency(chartData[chartData.length - 1].debt)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{chartData[chartData.length - 1].date}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function HistoricalDebtChart({ data }: { data: Array<{ date: string; debt: number }> }) {
  return (
    <ChartContainer
      height={250}
      margins={{ top: 15, right: 15, bottom: 25, left: 50 }}
      dataLength={data.length}
      ariaLabel="Historical national debt chart"
    >
      {({ innerWidth, innerHeight, margins, isHovering, nearestIndex }) => {
        const debts = data.map(d => d.debt);
        const [yMin, yMax] = niceExtent(debts, 0.05);
        const xScale = linearScale([0, data.length - 1], [margins.left, margins.left + innerWidth]);
        const yScale = linearScale([yMin, yMax], [margins.top + innerHeight, margins.top]);

        const points: Point[] = data.map((d, i) => ({
          x: xScale(i),
          y: yScale(d.debt),
        }));

        const hovered = data[nearestIndex];
        const hoveredPoint = points[nearestIndex];

        // Year labels
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
            <AreaFill data={points} baseline={margins.top + innerHeight} color="#ef4444" smooth />
            <LinePath data={points} color="#ef4444" smooth strokeWidth={2} />

            {/* End point */}
            <circle
              cx={points[points.length - 1]?.x}
              cy={points[points.length - 1]?.y}
              r={4}
              fill="#ef4444"
              stroke="var(--bg-surface-1)"
              strokeWidth={2}
            />

            {/* X labels */}
            {data.filter((_, i) => i % labelStep === 0 || i === data.length - 1).map(d => {
              const idx = data.indexOf(d);
              return (
                <text key={d.date} x={xScale(idx)} y={margins.top + innerHeight + 16} className="chart-x-label" textAnchor="middle">
                  {d.date.length === 4 ? d.date : d.date.slice(0, 4)}
                </text>
              );
            })}

            {/* Milestone annotations */}
            {data.map((d, i) => {
              const year = parseInt(d.date);
              if (!MILESTONES[year]) return null;
              return (
                <line
                  key={`ms-${year}`}
                  x1={xScale(i)}
                  y1={margins.top}
                  x2={xScale(i)}
                  y2={margins.top + innerHeight}
                  stroke="var(--text-dim)"
                  strokeWidth={1}
                  strokeDasharray="3 5"
                  opacity={0.4}
                />
              );
            })}

            {/* Crosshair + Tooltip */}
            {isHovering && hoveredPoint && (
              <>
                <Crosshair
                  x={hoveredPoint.x}
                  y={hoveredPoint.y}
                  top={margins.top}
                  height={innerHeight}
                  visible
                />
                <Tooltip
                  x={hoveredPoint.x}
                  y={hoveredPoint.y}
                  visible
                  containerWidth={margins.left + innerWidth + margins.right}
                >
                  <div className="chart-tooltip-value">
                    {hovered.date.length === 4 ? hovered.date : hovered.date.slice(0, 4)}
                    {MILESTONES[parseInt(hovered.date)] && (
                      <span style={{ fontSize: '9px', marginLeft: '4px', color: 'var(--text-muted)' }}>
                        {MILESTONES[parseInt(hovered.date)]}
                      </span>
                    )}
                  </div>
                  <div className="chart-tooltip-row">{formatCurrency(hovered.debt)}</div>
                </Tooltip>
              </>
            )}
          </>
        );
      }}
    </ChartContainer>
  );
}
