/**
 * Spending Treemap Screen — Proportional visualization of spending categories
 */

import { SubScreenHeader } from '../SubScreenHeader';
import { Treemap } from '../charts';
import { formatCurrency, formatBillions } from '../../utils/format';
import type { TreemapItem } from '../../utils/chart';

interface SpendingTreemapScreenProps {
  onBack: () => void;
}

const SPENDING_CATEGORIES: TreemapItem[] = [
  { label: 'Healthcare', value: 1.68e12, color: '#10b981' },
  { label: 'Social Security', value: 1.54e12, color: '#3b82f6' },
  { label: 'Interest on Debt', value: 968e9, color: '#ef4444' },
  { label: 'Defense', value: 895e9, color: '#3b82f6' },
  { label: 'Income Security', value: 518e9, color: '#f59e0b' },
  { label: 'Veterans', value: 351e9, color: '#0ea5e9' },
  { label: 'Education', value: 98e9, color: '#d97706' },
  { label: 'Transportation', value: 115e9, color: '#0ea5e9' },
  { label: 'Agriculture', value: 45e9, color: '#84cc16' },
  { label: 'Other', value: 781e9, color: '#6b7280' },
];

const POPULATION = 335000000;

export function SpendingTreemapScreen({ onBack }: SpendingTreemapScreenProps) {
  const total = SPENDING_CATEGORIES.reduce((s, c) => s + c.value, 0);

  return (
    <div className="screen sub-screen">
      <SubScreenHeader title="Spending Treemap" onBack={onBack} />
      <div className="screen-content">
        <div className="card" style={{ padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>FY2025 Total Spending</div>
          <div style={{ fontSize: '28px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: '4px 0' }}>{formatCurrency(total)}</div>
        </div>

        <div className="card" style={{ padding: '8px' }}>
          <Treemap data={SPENDING_CATEGORIES} height={350} />
        </div>

        {/* Detail list */}
        <div className="section">
          <span className="section-title">All Categories</span>
          <div className="card">
            {SPENDING_CATEGORIES.map((cat, i) => {
              const pct = (cat.value / total) * 100;
              const perCapita = cat.value / POPULATION;
              return (
                <div key={cat.label} className={`menu-item ${i < SPENDING_CATEGORIES.length - 1 ? 'border-b' : ''}`} style={{ padding: '12px 16px' }}>
                  <div className="menu-item-info" style={{ flex: 1, gap: '10px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: cat.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span className="menu-item-label" style={{ fontSize: '14px' }}>{cat.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                        {pct.toFixed(1)}% • ${Math.round(perCapita).toLocaleString()}/citizen
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    ${formatBillions(cat.value)}
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
