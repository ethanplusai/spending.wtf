/**
 * Revenue Breakdown Screen — Federal revenue by source with interactive donut chart
 */

import { SubScreenHeader } from '../SubScreenHeader';
import { LoadingCard } from '../LoadingCard';
import { ErrorCard } from '../ErrorCard';
import { useApi } from '../../hooks/useApi';
import { fetchRevenueBreakdown } from '../../services/treasuryApi';
import { formatCurrency } from '../../utils/format';
import { DonutChart } from '../charts';

interface RevenueBreakdownScreenProps {
  onBack: () => void;
}

export function RevenueBreakdownScreen({ onBack }: RevenueBreakdownScreenProps) {
  const { data: sources, isLoading, error, refetch } = useApi(() => fetchRevenueBreakdown(2025));

  const total = sources?.reduce((sum, s) => sum + s.amount, 0) || 0;

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title="Revenue Breakdown" onBack={onBack} />
      <div className="screen-content">
        {isLoading && <LoadingCard variant="chart" />}
        {error && <ErrorCard message={error} onRetry={refetch} />}

        {sources && sources.length > 0 && (
          <>
            {/* Total */}
            <div className="card" style={{ padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>FY2025 Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--positive)', margin: '4px 0' }}>{formatCurrency(total)}</div>
            </div>

            {/* Interactive Donut chart */}
            <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
              <DonutChart
                data={sources.map(s => ({
                  label: s.source,
                  value: s.amount,
                  percent: s.percent,
                  color: s.color,
                }))}
                centerLabel="Total Revenue"
                centerValue={formatCurrency(total)}
              />
            </div>

            {/* Source list */}
            <div className="section">
              <span className="section-title">Revenue Sources</span>
              <div className="card">
                {sources.map((s, i) => (
                  <div key={i} className={`menu-item ${i < sources.length - 1 ? 'border-b' : ''}`} style={{ padding: '12px 16px' }}>
                    <div className="menu-item-info" style={{ flex: 1, gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span className="menu-item-label" style={{ fontSize: '14px' }}>{s.source}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                          {s.percent.toFixed(1)}% of total
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                      {formatCurrency(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
