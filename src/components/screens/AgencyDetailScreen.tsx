/**
 * Agency Detail Screen — Budget breakdown for a single agency
 */

import { SubScreenHeader } from '../SubScreenHeader';
import { LoadingCard } from '../LoadingCard';
import { ErrorCard } from '../ErrorCard';
import { useApi } from '../../hooks/useApi';
import { fetchAgencyDetail } from '../../services/usaspending';
import { formatCurrency } from '../../utils/format';

interface AgencyDetailScreenProps {
  onBack: () => void;
  params?: Record<string, string | number>;
}

export function AgencyDetailScreen({ onBack, params }: AgencyDetailScreenProps) {
  const code = String(params?.code || '097');
  const name = String(params?.name || 'Agency');
  const fy = 2025;

  const { data, isLoading, error, refetch } = useApi(
    () => fetchAgencyDetail(code, fy),
    [code, fy]
  );

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title={name} onBack={onBack} />
      <div className="screen-content">
        {isLoading && <LoadingCard variant="full" />}
        {error && <ErrorCard message={error} onRetry={refetch} />}
        {data && (
          <>
            {/* Budget summary */}
            <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>FY{fy} Budget Authority</div>
              <div style={{ fontSize: '28px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: '4px 0' }}>
                {formatCurrency(data.budget_authority)}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Obligations</div>
                  <div style={{ fontSize: '16px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{formatCurrency(data.obligations)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outlays</div>
                  <div style={{ fontSize: '16px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{formatCurrency(data.outlays)}</div>
                </div>
              </div>
            </div>

            {/* Award type breakdown bar chart */}
            {data.award_types.length > 0 && (
              <div className="section">
                <span className="section-title">Spending by Award Type</span>
                <div className="card" style={{ padding: '16px' }}>
                  {data.award_types.map((at, i) => {
                    const maxAmount = Math.max(...data.award_types.map(a => a.amount));
                    const pct = maxAmount > 0 ? (at.amount / maxAmount) * 100 : 0;
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#0ea5e9'];
                    return (
                      <div key={i} style={{ marginBottom: i < data.award_types.length - 1 ? '12px' : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{at.type}</span>
                          <span style={{ fontSize: '13px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{formatCurrency(at.amount)}</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '4px', background: 'var(--glass-bg)' }}>
                          <div style={{ height: '100%', borderRadius: '4px', background: colors[i % colors.length], width: `${pct}%`, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
