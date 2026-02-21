/**
 * State Detail Screen — Federal spending detail for a single state
 */

import { SubScreenHeader } from '../SubScreenHeader';
import { LoadingCard } from '../LoadingCard';
import { ErrorCard } from '../ErrorCard';
import { useApi } from '../../hooks/useApi';
import { fetchStateDetail } from '../../services/usaspending';
import { formatCurrency } from '../../utils/format';

interface StateDetailScreenProps {
  onBack: () => void;
  params?: Record<string, string | number>;
}

export function StateDetailScreen({ onBack, params }: StateDetailScreenProps) {
  const fips = String(params?.fips || 'CA');
  const name = String(params?.name || 'State');

  const { data, isLoading, error, refetch } = useApi(
    () => fetchStateDetail(fips, 2025),
    [fips]
  );

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title={name} onBack={onBack} />
      <div className="screen-content">
        {isLoading && <LoadingCard variant="full" />}
        {error && <ErrorCard message={error} onRetry={refetch} />}
        {data && (
          <>
            <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Federal Awards</div>
              <div style={{ fontSize: '28px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: '4px 0' }}>
                {formatCurrency(data.total_awards)}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Population</div>
                  <div style={{ fontSize: '16px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    {data.population > 0 ? (data.population / 1e6).toFixed(1) + 'M' : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per Capita</div>
                  <div style={{ fontSize: '16px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    {data.per_capita > 0 ? formatCurrency(data.per_capita, false) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {data.award_types.length > 0 && (
              <div className="section">
                <span className="section-title">By Award Type</span>
                <div className="card">
                  {data.award_types.map((at, i) => (
                    <div key={i} className={`menu-item ${i < data.award_types.length - 1 ? 'border-b' : ''}`}>
                      <div className="menu-item-info">
                        <span className="menu-item-label">{at.type || 'Other'}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                        {formatCurrency(at.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
