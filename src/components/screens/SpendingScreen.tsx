/**
 * Spending Screen - Government Spending by Category
 * Shows breakdown of federal spending with interactive year selection
 */

import { useState, useMemo } from 'react';
import type { SubScreen, TabId } from '../../types';
import { formatTrillions, formatBillions, formatMillions, formatCurrency } from '../../utils/format';
import { ChartContainer, BarGroup, Tooltip } from '../charts';

// Historical spending data by fiscal year
const SPENDING_BY_YEAR: Record<string, YearData> = {
  fy22: {
    totalSpending: 6.27e12, totalRevenue: 4.90e12, deficit: 1.37e12,
    categories: [
      { name: 'Social Security', amount: 1.22e12, percent: 19.5, color: '#3b82f6', change: 6 },
      { name: 'Healthcare', amount: 1.41e12, percent: 22.5, color: '#10b981', change: 4 },
      { name: 'Defense', amount: 782e9, percent: 12.5, color: '#3b82f6', change: 2 },
      { name: 'Interest on Debt', amount: 475e9, percent: 7.6, color: '#ef4444', change: 12 },
      { name: 'Income Security', amount: 865e9, percent: 13.8, color: '#f59e0b', change: -28 },
      { name: 'Veterans Benefits', amount: 274e9, percent: 4.4, color: '#0ea5e9', change: 8 },
      { name: 'Education', amount: 139e9, percent: 2.2, color: '#d97706', change: -15 },
      { name: 'Other', amount: 1.07e12, percent: 17.1, color: '#6b7280', change: -5 },
    ]
  },
  fy23: {
    totalSpending: 6.13e12, totalRevenue: 4.44e12, deficit: 1.69e12,
    categories: [
      { name: 'Social Security', amount: 1.35e12, percent: 22.0, color: '#3b82f6', change: 11 },
      { name: 'Healthcare', amount: 1.46e12, percent: 23.8, color: '#10b981', change: 4 },
      { name: 'Defense', amount: 816e9, percent: 13.3, color: '#3b82f6', change: 4 },
      { name: 'Interest on Debt', amount: 659e9, percent: 10.7, color: '#ef4444', change: 39 },
      { name: 'Income Security', amount: 587e9, percent: 9.6, color: '#f59e0b', change: -32 },
      { name: 'Veterans Benefits', amount: 302e9, percent: 4.9, color: '#0ea5e9', change: 10 },
      { name: 'Education', amount: 114e9, percent: 1.9, color: '#d97706', change: -18 },
      { name: 'Other', amount: 857e9, percent: 14.0, color: '#6b7280', change: -20 },
    ]
  },
  fy24: {
    totalSpending: 6.75e12, totalRevenue: 4.92e12, deficit: 1.83e12,
    categories: [
      { name: 'Social Security', amount: 1.46e12, percent: 21.6, color: '#3b82f6', change: 8 },
      { name: 'Healthcare', amount: 1.60e12, percent: 23.7, color: '#10b981', change: 10 },
      { name: 'Defense', amount: 874e9, percent: 12.9, color: '#3b82f6', change: 7 },
      { name: 'Interest on Debt', amount: 882e9, percent: 13.1, color: '#ef4444', change: 34 },
      { name: 'Income Security', amount: 541e9, percent: 8.0, color: '#f59e0b', change: -8 },
      { name: 'Veterans Benefits', amount: 325e9, percent: 4.8, color: '#0ea5e9', change: 8 },
      { name: 'Education', amount: 104e9, percent: 1.5, color: '#d97706', change: -9 },
      { name: 'Other', amount: 963e9, percent: 14.3, color: '#6b7280', change: 12 },
    ]
  },
  fy25: {
    totalSpending: 7.0e12, totalRevenue: 5.05e12, deficit: 1.95e12,
    categories: [
      { name: 'Social Security', amount: 1.54e12, percent: 22.0, color: '#3b82f6', change: 5 },
      { name: 'Healthcare', amount: 1.68e12, percent: 24.0, color: '#10b981', change: 5 },
      { name: 'Defense', amount: 895e9, percent: 12.8, color: '#3b82f6', change: 2 },
      { name: 'Interest on Debt', amount: 968e9, percent: 13.8, color: '#ef4444', change: 10 },
      { name: 'Income Security', amount: 518e9, percent: 7.4, color: '#f59e0b', change: -4 },
      { name: 'Veterans Benefits', amount: 351e9, percent: 5.0, color: '#0ea5e9', change: 8 },
      { name: 'Education', amount: 98e9, percent: 1.4, color: '#d97706', change: -6 },
      { name: 'Other', amount: 945e9, percent: 13.5, color: '#6b7280', change: -2 },
    ]
  }
};

const YEARLY_TREND = [
  { year: 2019, spending: 4.45e12, revenue: 3.46e12 },
  { year: 2020, spending: 6.55e12, revenue: 3.42e12 },
  { year: 2021, spending: 6.82e12, revenue: 4.05e12 },
  { year: 2022, spending: 6.27e12, revenue: 4.90e12 },
  { year: 2023, spending: 6.13e12, revenue: 4.44e12 },
  { year: 2024, spending: 6.75e12, revenue: 4.92e12 },
  { year: 2025, spending: 7.0e12, revenue: 5.05e12 },
];

interface YearData {
  totalSpending: number;
  totalRevenue: number;
  deficit: number;
  categories: Array<{ name: string; amount: number; percent: number; color: string; change: number }>;
}

type FiscalYear = 'fy22' | 'fy23' | 'fy24' | 'fy25';

interface SpendingScreenProps {
  onNavigate?: (subScreen: SubScreen, params?: Record<string, string | number>) => void;
  onTabChange?: (tab: TabId) => void;
}

export function SpendingScreen({ onNavigate, onTabChange }: SpendingScreenProps) {
  const [selectedYear, setSelectedYear] = useState<FiscalYear>('fy25');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'amount' | 'percent' | 'change'>('amount');

  const yearData = SPENDING_BY_YEAR[selectedYear];

  const sortedCategories = useMemo(() => {
    return [...yearData.categories].sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'percent') return b.percent - a.percent;
      return Math.abs(b.change) - Math.abs(a.change);
    });
  }, [yearData, sortBy]);

  const population = 335000000;
  const households = 130000000;

  return (
    <div className="screen spending-screen">
      <header className="screen-header">
        <h1 className="header-title">Spending</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onNavigate && (
            <button className="icon-btn" onClick={() => onNavigate('spending-treemap')}>
              <TreemapIcon />
            </button>
          )}
          <button className="icon-btn" onClick={() => setSortBy(sortBy === 'amount' ? 'change' : 'amount')}>
            <SortIcon />
          </button>
        </div>
      </header>

      <div className="time-period-selector">
        {(['fy22', 'fy23', 'fy24', 'fy25'] as const).map(year => (
          <button key={year} className={`period-btn ${selectedYear === year ? 'active' : ''}`} onClick={() => setSelectedYear(year)}>
            {year.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="monthly-chart">
        <YearlyBarChart data={YEARLY_TREND} />
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-indicator revenue"></span>Revenue</span>
          <span className="legend-item"><span className="legend-indicator spend"></span>Spending</span>
        </div>
      </div>

      <div className="screen-content">
        <div className="card summary-card">
          <div className="summary-row border-b" onClick={() => setExpandedCategory(expandedCategory === 'total' ? null : 'total')}>
            <div className="summary-info">
              <span className="summary-icon spending-summary-icon"><SpendingTotalIcon /></span>
              <span className="summary-label">Total Spending</span>
            </div>
            <div className="summary-value-wrap">
              <span className="summary-value">${formatTrillions(yearData.totalSpending)}</span>
              <ChevronIcon direction={expandedCategory === 'total' ? 'down' : 'right'} />
            </div>
          </div>

          <div className="summary-row border-b clickable" onClick={() => onNavigate?.('revenue-breakdown')}>
            <div className="summary-info">
              <span className="summary-icon revenue-summary-icon"><RevenueIcon /></span>
              <span className="summary-label">Total Revenue</span>
            </div>
            <div className="summary-value-wrap">
              <span className="summary-value positive">${formatTrillions(yearData.totalRevenue)}</span>
              <ChevronIcon direction="right" />
            </div>
          </div>

          <div className="summary-row clickable" onClick={() => onTabChange?.('transactions')}>
            <div className="summary-info">
              <span className="summary-icon deficit-summary-icon"><DeficitIcon /></span>
              <span className="summary-label">Budget Deficit</span>
            </div>
            <div className="summary-value-wrap">
              <span className="summary-value negative">-${formatTrillions(yearData.deficit)}</span>
              <ChevronIcon direction="right" />
            </div>
          </div>
        </div>

        <div className="sort-indicator">
          <span>Sorted by: </span>
          <button className="sort-toggle" onClick={() => setSortBy(sortBy === 'amount' ? 'change' : sortBy === 'change' ? 'percent' : 'amount')}>
            {sortBy === 'amount' ? 'Amount' : sortBy === 'change' ? 'YoY Change' : 'Percent'} ↕
          </button>
        </div>

        <div className="section">
          <span className="section-title">Breakdown by Category</span>
          <div className="card category-card">
            {sortedCategories.map((cat, i) => (
              <div
                key={cat.name}
                className={`category-row ${i < sortedCategories.length - 1 ? 'border-b' : ''} ${expandedCategory === cat.name ? 'expanded' : ''}`}
                onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
              >
                <div className="category-info">
                  <div className="category-bar-container">
                    <div className="category-bar" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                  </div>
                  <div className="category-details">
                    <span className="category-name">{cat.name}</span>
                    <span className="category-percent">{cat.percent.toFixed(1)}% of total</span>
                  </div>
                </div>
                <div className="category-amount-wrap">
                  <span className="category-amount">${formatBillions(cat.amount)}</span>
                  <span className={`category-change ${cat.change >= 0 ? 'up' : 'down'}`}>
                    {cat.change >= 0 ? '↑' : '↓'} {Math.abs(cat.change)}%
                  </span>
                </div>

                {expandedCategory === cat.name && (
                  <div className="category-expanded">
                    <div className="expanded-stat">
                      <span className="expanded-label">Per Citizen</span>
                      <span className="expanded-value">${Math.round(cat.amount / population).toLocaleString()}</span>
                    </div>
                    <div className="expanded-stat">
                      <span className="expanded-label">Per Household</span>
                      <span className="expanded-value">${Math.round(cat.amount / households).toLocaleString()}</span>
                    </div>
                    <div className="expanded-stat">
                      <span className="expanded-label">Per Day</span>
                      <span className="expanded-value">${formatBillions(cat.amount / 365)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <span className="section-title">In Perspective</span>
          <div className="card perspective-card">
            <div className="perspective-item">
              <span className="perspective-icon">👤</span>
              <div className="perspective-text">
                <strong>${Math.round(yearData.totalSpending / population).toLocaleString()}</strong>
                <span>per U.S. citizen</span>
              </div>
            </div>
            <div className="perspective-item">
              <span className="perspective-icon">🏠</span>
              <div className="perspective-text">
                <strong>${Math.round(yearData.totalSpending / households).toLocaleString()}</strong>
                <span>per U.S. household</span>
              </div>
            </div>
            <div className="perspective-item">
              <span className="perspective-icon">⏱️</span>
              <div className="perspective-text">
                <strong>${formatBillions(yearData.totalSpending / 365)}</strong>
                <span>spent per day</span>
              </div>
            </div>
            <div className="perspective-item">
              <span className="perspective-icon">⏰</span>
              <div className="perspective-text">
                <strong>${formatMillions(yearData.totalSpending / 365 / 24 / 60)}</strong>
                <span>spent per minute</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Interactive Yearly Bar Chart with hover tooltip
function YearlyBarChart({ data }: { data: Array<{ year: number; spending: number; revenue: number }> }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <ChartContainer
      height={160}
      margins={{ top: 15, right: 10, bottom: 25, left: 10 }}
      dataLength={data.length}
      ariaLabel="Yearly spending vs revenue chart"
    >
      {({ innerWidth, innerHeight, margins }) => {
        const maxVal = Math.max(...data.flatMap(d => [d.spending, d.revenue])) * 1.1;

        const barData = data.map((item) => ({
          label: item.year.toString().slice(-2),
          values: [
            { value: item.revenue, color: 'var(--positive)', label: 'Revenue' },
            { value: item.spending, color: 'var(--brand-red)', label: 'Spending' },
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
            {hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < data.length && (
              <Tooltip
                x={margins.left + (hoveredIdx / data.length) * innerWidth + innerWidth / data.length / 2}
                y={margins.top}
                visible
                containerWidth={margins.left + innerWidth + margins.right}
              >
                <div className="chart-tooltip-value">FY{data[hoveredIdx].year}</div>
                <div className="chart-tooltip-row" style={{ color: 'var(--positive)' }}>Revenue: {formatCurrency(data[hoveredIdx].revenue)}</div>
                <div className="chart-tooltip-row" style={{ color: 'var(--negative)' }}>Spending: {formatCurrency(data[hoveredIdx].spending)}</div>
                <div className="chart-tooltip-row">Deficit: {formatCurrency(data[hoveredIdx].spending - data[hoveredIdx].revenue)}</div>
              </Tooltip>
            )}
          </>
        );
      }}
    </ChartContainer>
  );
}

// Icons
function SortIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5h10M11 9h7M11 13h4M3 17l4 4 4-4M7 3v18" /></svg>; }
function TreemapIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>; }
function SpendingTotalIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>; }
function RevenueIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>; }
function DeficitIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5" /><path d="M5 12l7 7 7-7" /></svg>; }
function ChevronIcon({ direction }: { direction: 'right' | 'down' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: direction === 'down' ? 'rotate(90deg)' : undefined, transition: 'transform 0.2s' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
