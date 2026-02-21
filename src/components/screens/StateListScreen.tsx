/**
 * State List Screen — Federal spending by state
 */

import { useState } from 'react';
import { SubScreenHeader } from '../SubScreenHeader';
import { LoadingCard } from '../LoadingCard';
import { ErrorCard } from '../ErrorCard';
import { useApi } from '../../hooks/useApi';
import { fetchSpendingByState } from '../../services/usaspending';
import { formatCurrency } from '../../utils/format';
import type { SubScreen } from '../../types';

interface StateListScreenProps {
  onBack: () => void;
  onNavigate: (subScreen: SubScreen, params?: Record<string, string | number>) => void;
}

type SortKey = 'total' | 'per_capita';

export function StateListScreen({ onBack, onNavigate }: StateListScreenProps) {
  const [sortBy, setSortBy] = useState<SortKey>('total');
  const { data: states, isLoading, error, refetch } = useApi(() => fetchSpendingByState(2025));

  const sorted = [...(states || [])].sort((a, b) =>
    sortBy === 'total'
      ? b.aggregated_amount - a.aggregated_amount
      : b.per_capita - a.per_capita
  );

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title="By State" onBack={onBack} />
      <div className="screen-content">
        {/* Sort toggle */}
        <div className="sort-indicator" style={{ marginBottom: '8px' }}>
          <span>Sort by: </span>
          <button className="sort-toggle" onClick={() => setSortBy(sortBy === 'total' ? 'per_capita' : 'total')}>
            {sortBy === 'total' ? 'Total Amount' : 'Per Capita'} ↕
          </button>
        </div>

        {isLoading && <LoadingCard count={10} />}
        {error && <ErrorCard message={error} onRetry={refetch} />}
        {sorted.length > 0 && (() => {
          const maxAmount = Math.max(...sorted.map(s => sortBy === 'total' ? s.aggregated_amount : s.per_capita));
          return (
            <div className="card">
              {sorted.map((state, i) => {
                const val = sortBy === 'total' ? state.aggregated_amount : state.per_capita;
                const barPct = maxAmount > 0 ? (val / maxAmount) * 100 : 0;
                const intensity = 0.3 + (barPct / 100) * 0.7;
                return (
                  <div
                    key={state.shape_code}
                    className={`menu-item clickable ${i < sorted.length - 1 ? 'border-b' : ''}`}
                    onClick={() => onNavigate('state-detail', { fips: state.shape_code, name: state.display_name })}
                    style={{ position: 'relative', overflow: 'hidden' }}
                  >
                    {/* Horizontal bar background */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${barPct}%`,
                      background: `rgba(59, 130, 246, ${intensity * 0.15})`,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: '0 4px 4px 0',
                    }} />
                    <div className="menu-item-info" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', width: '28px', textAlign: 'center' }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span className="menu-item-label">{state.display_name}</span>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Total: {formatCurrency(state.aggregated_amount)}
                          </span>
                          {state.per_capita > 0 && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Per Capita: {formatCurrency(state.per_capita, false)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'relative', zIndex: 1 }}><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
