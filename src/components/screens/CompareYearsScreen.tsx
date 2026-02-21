/**
 * Compare Years Screen — Side-by-side fiscal year comparison
 */

import { useState } from 'react';
import { SubScreenHeader } from '../SubScreenHeader';
import { LoadingCard } from '../LoadingCard';
import { ErrorCard } from '../ErrorCard';
import { useApi } from '../../hooks/useApi';
import { fetchMonthlyBudgetData } from '../../services/treasuryApi';
import { formatCurrency } from '../../utils/format';
import { ChartContainer, BarGroup, Tooltip } from '../charts';

interface CompareYearsScreenProps {
  onBack: () => void;
}

const YEARS = [2022, 2023, 2024, 2025];

export function CompareYearsScreen({ onBack }: CompareYearsScreenProps) {
  const [yearA, setYearA] = useState(2024);
  const [yearB, setYearB] = useState(2025);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { data: dataA, isLoading: loadingA, error: errorA, refetch: refetchA } = useApi(
    () => fetchMonthlyBudgetData(yearA),
    [yearA]
  );

  const { data: dataB, isLoading: loadingB, error: errorB, refetch: refetchB } = useApi(
    () => fetchMonthlyBudgetData(yearB),
    [yearB]
  );

  const isLoading = loadingA || loadingB;
  const error = errorA || errorB;

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title="Compare Years" onBack={onBack} />
      <div className="screen-content">
        {/* Year selectors */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Year A</div>
            <div className="time-period-selector" style={{ margin: 0 }}>
              {YEARS.map(y => (
                <button key={y} className={`period-btn ${yearA === y ? 'active' : ''}`} onClick={() => setYearA(y)}>
                  FY{y.toString().slice(-2)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Year B</div>
            <div className="time-period-selector" style={{ margin: 0 }}>
              {YEARS.map(y => (
                <button key={y} className={`period-btn ${yearB === y ? 'active' : ''}`} onClick={() => setYearB(y)}>
                  FY{y.toString().slice(-2)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && <LoadingCard variant="chart" />}
        {error && <ErrorCard message={error} onRetry={() => { refetchA(); refetchB(); }} />}

        {dataA && dataB && (
          <>
            {/* Interactive grouped bar chart */}
            <div className="card" style={{ padding: '16px' }}>
              <ChartContainer
                height={180}
                margins={{ top: 15, right: 15, bottom: 30, left: 15 }}
                dataLength={3}
                ariaLabel="Fiscal year comparison chart"
              >
                {({ innerWidth, innerHeight, margins }) => {
                  const metrics = [
                    { label: 'Spending', a: dataA.totalSpending, b: dataB.totalSpending },
                    { label: 'Revenue', a: dataA.totalRevenue, b: dataB.totalRevenue },
                    { label: 'Deficit', a: dataA.deficit, b: dataB.deficit },
                  ];
                  const maxVal = Math.max(...metrics.flatMap(m => [m.a, m.b])) * 1.1;

                  const barData = metrics.map(m => ({
                    label: m.label,
                    values: [
                      { value: m.a, color: '#3b82f6' },
                      { value: m.b, color: '#f59e0b' },
                    ],
                  }));

                  return (
                    <>
                      <BarGroup
                        data={barData}
                        innerWidth={innerWidth}
                        innerHeight={innerHeight}
                        margins={margins}
                        maxValue={maxVal}
                        hoveredIndex={hoveredIdx}
                        onHover={setHoveredIdx}
                        animate
                      />
                      {hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < metrics.length && (
                        <Tooltip
                          x={margins.left + (hoveredIdx / 3) * innerWidth + innerWidth / 6}
                          y={margins.top}
                          visible
                          containerWidth={margins.left + innerWidth + margins.right}
                        >
                          <div className="chart-tooltip-value">{metrics[hoveredIdx].label}</div>
                          <div className="chart-tooltip-row" style={{ color: '#3b82f6' }}>FY{yearA}: {formatCurrency(metrics[hoveredIdx].a)}</div>
                          <div className="chart-tooltip-row" style={{ color: '#f59e0b' }}>FY{yearB}: {formatCurrency(metrics[hoveredIdx].b)}</div>
                          <div className={`chart-tooltip-change ${metrics[hoveredIdx].b > metrics[hoveredIdx].a ? 'negative' : 'positive'}`}>
                            {((metrics[hoveredIdx].b - metrics[hoveredIdx].a) / metrics[hoveredIdx].a * 100).toFixed(1)}%
                          </div>
                        </Tooltip>
                      )}
                    </>
                  );
                }}
              </ChartContainer>
              <div className="chart-legend" style={{ marginTop: '8px' }}>
                <span className="legend-item">
                  <span className="legend-indicator" style={{ background: '#3b82f6' }}></span>
                  FY{yearA}
                </span>
                <span className="legend-item">
                  <span className="legend-indicator" style={{ background: '#f59e0b' }}></span>
                  FY{yearB}
                </span>
              </div>
            </div>

            {/* Side-by-side stats */}
            <div className="section">
              <span className="section-title">Comparison</span>
              <div className="card">
                {[
                  { label: 'Total Spending', valA: dataA.totalSpending, valB: dataB.totalSpending },
                  { label: 'Total Revenue', valA: dataA.totalRevenue, valB: dataB.totalRevenue },
                  { label: 'Deficit', valA: dataA.deficit, valB: dataB.deficit },
                ].map((row, i, arr) => {
                  const change = row.valA > 0 ? ((row.valB - row.valA) / row.valA * 100) : 0;
                  return (
                    <div key={row.label} className={`menu-item ${i < arr.length - 1 ? 'border-b' : ''}`} style={{ padding: '12px 16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: '#3b82f6' }}>{formatCurrency(row.valA)}</span>
                          <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: '#f59e0b' }}>{formatCurrency(row.valB)}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: change > 0 ? '#ef4444' : '#10b981' }}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
