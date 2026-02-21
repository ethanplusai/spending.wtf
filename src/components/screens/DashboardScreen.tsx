/**
 * Dashboard Screen - Government Spending Overview
 * Shows total federal spending, deficit, and key metrics
 */

import { useState, useRef, useEffect } from 'react';
import type { SubScreen, TabId } from '../../types';
import { formatTrillions, formatBillions, formatCurrency } from '../../utils/format';
import { useApi } from '../../hooks/useApi';
import { fetchMonthlyBudgetData } from '../../services/treasuryApi';
import { smoothPath, smoothAreaPath } from '../../utils/chart';
import type { Point } from '../../utils/chart';
import { LiveTicker } from '../charts/LiveTicker';

interface DashboardScreenProps {
  data: {
    fiscalYear: number;
    totalSpending: number;
    totalRevenue: number;
    deficit: number;
    dailySpending: number;
    perCapita: number;
  };
  onNavigate?: (subScreen: SubScreen, params?: Record<string, string | number>) => void;
  onTabChange?: (tab: TabId) => void;
}

const AVAILABLE_FYS = [2022, 2023, 2024, 2025];

export function DashboardScreen({ data: fallbackData, onNavigate, onTabChange }: DashboardScreenProps) {
  const [showInfo, setShowInfo] = useState(true);
  const [showBellPopover, setShowBellPopover] = useState(false);
  const [selectedFY, setSelectedFY] = useState(2025);
  const [activeCard, setActiveCard] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { data: apiData } = useApi(
    () => fetchMonthlyBudgetData(selectedFY),
    [selectedFY]
  );

  const displayData = apiData
    ? {
        fiscalYear: apiData.fiscalYear,
        totalSpending: apiData.totalSpending,
        totalRevenue: apiData.totalRevenue,
        deficit: apiData.deficit,
        dailySpending: apiData.totalSpending / 365,
        perCapita: Math.round(apiData.totalSpending / 335000000),
      }
    : { ...fallbackData, fiscalYear: selectedFY };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const deficitPercent = ((displayData.deficit / displayData.totalRevenue) * 100).toFixed(0);

  const cycleFY = () => {
    const idx = AVAILABLE_FYS.indexOf(selectedFY);
    setSelectedFY(AVAILABLE_FYS[(idx + 1) % AVAILABLE_FYS.length]);
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.offsetWidth;
      setActiveCard(Math.round(scrollLeft / cardWidth));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
    setActiveCard(index);
  };

  return (
    <div className="screen dashboard-screen">
      {/* Header */}
      <header className="screen-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 className="header-date">{currentDate}</h1>
          <button className="icon-btn search-header-btn desktop-hide" onClick={() => onNavigate?.('search')}>
            <SearchIcon />
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="icon-btn notification-btn" onClick={() => setShowBellPopover(!showBellPopover)}>
            <BellIcon />
          </button>
          {showBellPopover && (
            <div className="bell-popover card">
              <p className="info-text" style={{ margin: 0, fontSize: '13px' }}>
                <strong>Data Source:</strong> Treasury Fiscal Data API<br />
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}<br />
                <strong>Coverage:</strong> FY{selectedFY} federal budget data
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="screen-content">
        {/* Carousel */}
        <div className="carousel-container" ref={carouselRef}>
          {/* Card 1: Spending Overview */}
          <div className="card spending-overview-card carousel-card">
            <div className="spending-header">
              <span className="spending-label">FY{displayData.fiscalYear} Federal Spending</span>
              <div className="spending-legend">
                <span className="legend-item">
                  <span className="legend-dot spending-dot"></span>
                  Outlays
                </span>
              </div>
            </div>
            <div className="spending-amount">${formatTrillions(displayData.totalSpending)}</div>
            <div className="spending-chart">
              <SpendingVsRevenueChart spending={displayData.totalSpending} revenue={displayData.totalRevenue} />
            </div>
            <div className="deficit-alert">
              <div className="alert-icon"><WarningIcon /></div>
              <span className="alert-text">
                Deficit of <strong>${formatTrillions(displayData.deficit)}</strong> ({deficitPercent}% over revenue)
              </span>
            </div>
          </div>

          {/* Card 2: Revenue Overview */}
          <div className="card spending-overview-card carousel-card">
            <div className="spending-header">
              <span className="spending-label">FY{displayData.fiscalYear} Revenue</span>
            </div>
            <div className="spending-amount positive">${formatTrillions(displayData.totalRevenue)}</div>
            <RevenueMiniBars />
          </div>

          {/* Card 3: Deficit/Debt Snapshot */}
          <div className="card spending-overview-card carousel-card">
            <div className="spending-header">
              <span className="spending-label">Deficit & Debt Snapshot</span>
            </div>
            <div className="spending-amount negative">
              -<LiveTicker value={displayData.deficit / 1e12} prefix="$" suffix="T" precision={2} />
            </div>
            <div className="snapshot-stats">
              <div className="snapshot-stat">
                <span className="snapshot-label">Daily Deficit</span>
                <span className="snapshot-value negative">${formatBillions(displayData.deficit / 365)}</span>
              </div>
              <div className="snapshot-stat">
                <span className="snapshot-label">Per Citizen</span>
                <span className="snapshot-value negative">${Math.round(displayData.deficit / 335000000).toLocaleString()}</span>
              </div>
              <div className="snapshot-stat">
                <span className="snapshot-label">% of Spending</span>
                <span className="snapshot-value negative">{((displayData.deficit / displayData.totalSpending) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Card 4: Per-Capita Tracker */}
          <div className="card spending-overview-card carousel-card">
            <div className="spending-header">
              <span className="spending-label">Your Share</span>
            </div>
            <div className="spending-amount">
              <LiveTicker value={displayData.perCapita} prefix="$" suffix="/yr" />
            </div>
            <div className="snapshot-stats">
              <div className="snapshot-stat">
                <span className="snapshot-label">Per Day</span>
                <span className="snapshot-value">${formatCurrency(displayData.dailySpending / 335000000, false)}</span>
              </div>
              <div className="snapshot-stat">
                <span className="snapshot-label">Per Household</span>
                <span className="snapshot-value">${Math.round(displayData.totalSpending / 130000000).toLocaleString()}</span>
              </div>
              <div className="snapshot-stat">
                <span className="snapshot-label">Per Taxpayer</span>
                <span className="snapshot-value">${Math.round(displayData.totalSpending / 150000000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel dots */}
        <div className="carousel-dots">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`dot ${activeCard === i ? 'active' : ''}`} onClick={() => scrollToCard(i)} />
          ))}
        </div>

        {/* Journey CTA */}
        <div className="journey-cta-banner clickable" onClick={() => onNavigate?.('journey')}>
          <div className="journey-cta-banner-content">
            <div className="journey-cta-banner-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="journey-cta-banner-text">
              <span className="journey-cta-banner-title">The $38 Trillion Story</span>
              <span className="journey-cta-banner-desc">How U.S. spending got here — an interactive journey</span>
            </div>
          </div>
          <div className="journey-cta-banner-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </div>

        {/* Info Card */}
        {showInfo && (
          <div className="section">
            <div className="section-header">
              <span className="section-title">What This Means</span>
              <button className="text-btn" onClick={() => setShowInfo(false)}>Dismiss</button>
            </div>
            <div className="card info-card">
              <p className="info-text">
                The federal government spends <strong>${formatBillions(displayData.dailySpending)}/day</strong>.
                That's <strong>${displayData.perCapita.toLocaleString()}</strong> per U.S. citizen this year.
              </p>
            </div>
          </div>
        )}

        {/* Key Accounts Section */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">Fiscal Summary</span>
            <button className="text-btn" onClick={cycleFY}>FY{displayData.fiscalYear}</button>
          </div>
          <div className="card accounts-card">
            <div
              className="account-row border-b clickable"
              onClick={() => onNavigate?.('revenue-breakdown')}
            >
              <div className="account-info">
                <span className="account-icon revenue-icon"><RevenueIcon /></span>
                <span className="account-name">Total Revenue</span>
              </div>
              <div className="account-balance-wrap">
                <span className="account-balance positive">${formatTrillions(displayData.totalRevenue)}</span>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className="account-row border-b clickable"
              onClick={() => onTabChange?.('spending')}
            >
              <div className="account-info">
                <span className="account-icon spending-icon"><SpendingIcon /></span>
                <span className="account-name">Total Spending</span>
              </div>
              <div className="account-balance-wrap">
                <span className="account-balance">${formatTrillions(displayData.totalSpending)}</span>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className="account-row clickable"
              onClick={() => onTabChange?.('transactions')}
            >
              <div className="account-info">
                <span className="account-icon deficit-icon"><DeficitIcon /></span>
                <span className="account-name">Budget Deficit</span>
              </div>
              <div className="account-balance-wrap">
                <span className="account-balance negative">-${formatTrillions(displayData.deficit)}</span>
                <ChevronRightIcon />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpendingVsRevenueChart({ spending, revenue }: { spending: number; revenue: number }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const maxVal = spending * 1.1;
  const chartWidth = 340;
  const chartHeight = 100;
  const labelPad = 50;
  const totalWidth = chartWidth + labelPad;

  const points: Point[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * chartWidth;
    const monthProgress = i / 12;
    const val = monthProgress * spending;
    const y = chartHeight - (val / maxVal) * chartHeight;
    points.push({ x, y: Math.max(5, y) });
  }

  const pathD = smoothPath(points);
  const areaD = smoothAreaPath(points, chartHeight);
  const revenueY = chartHeight - (revenue / maxVal) * chartHeight;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const idx = Math.round((x / rect.width) * 12);
      setHoverIndex(Math.max(0, Math.min(12, idx)));
    };
    const handleLeave = () => setHoverIndex(null);
    svg.addEventListener('mousemove', handleMove);
    svg.addEventListener('mouseleave', handleLeave);
    return () => {
      svg.removeEventListener('mousemove', handleMove);
      svg.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredSpending = hoverIndex !== null ? (hoverIndex / 12) * spending : 0;
  const hoveredRevenue = hoverIndex !== null ? (hoverIndex / 12) * revenue : 0;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${totalWidth} ${chartHeight + 15}`} className="mini-chart" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Spending vs Revenue chart" style={{ cursor: 'crosshair' }}>
      <defs>
        <linearGradient id="govAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#govAreaGradient)" className="chart-animate-fade" />
      <line x1="0" y1={revenueY} x2={chartWidth} y2={revenueY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
      <rect x="0" y={revenueY - 10} width="54" height="18" rx="4" fill="#10b981" />
      <text x="27" y={revenueY + 2} fill="white" fontSize="9" fontWeight="600" textAnchor="middle">Revenue</text>
      <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" className="chart-animate-path" />
      <circle cx={chartWidth} cy={points[points.length - 1].y} r="5" fill="#ef4444" stroke="#141414" strokeWidth="2.5" />
      <text x={chartWidth + 8} y="15" fill="#525252" fontSize="9" fontWeight="500">${(maxVal / 1e12).toFixed(1)}T</text>
      <text x={chartWidth + 8} y={chartHeight + 5} fill="#525252" fontSize="9" fontWeight="500">$0</text>

      {/* Crosshair on hover */}
      {hoveredPoint && hoverIndex !== null && (
        <g style={{ pointerEvents: 'none' }}>
          <line x1={hoveredPoint.x} y1={0} x2={hoveredPoint.x} y2={chartHeight} stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
          <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#ef4444" stroke="var(--bg-surface-1)" strokeWidth="2.5" />
          <foreignObject x={hoveredPoint.x > chartWidth / 2 ? hoveredPoint.x - 130 : hoveredPoint.x + 10} y={Math.max(0, hoveredPoint.y - 35)} width="120" height="50" style={{ pointerEvents: 'none', overflow: 'visible' }}>
            <div className="chart-tooltip">
              <div className="chart-tooltip-value">Month {hoverIndex}</div>
              <div className="chart-tooltip-row">Spent: {formatCurrency(hoveredSpending)}</div>
              <div className="chart-tooltip-row">Revenue: {formatCurrency(hoveredRevenue)}</div>
            </div>
          </foreignObject>
        </g>
      )}
    </svg>
  );
}

function RevenueMiniBars() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const bars = [
    { label: 'Income Tax', percent: 48, color: '#3b82f6', amount: 2.43e12 },
    { label: 'Payroll Tax', percent: 32, color: '#10b981', amount: 1.62e12 },
    { label: 'Corporate', percent: 8, color: '#3b82f6', amount: 420e9 },
    { label: 'Other', percent: 12, color: '#6b7280', amount: 371e9 },
  ];

  return (
    <div className="revenue-breakdown-mini">
      {bars.map((bar, i) => (
        <div
          key={bar.label}
          className="mini-bar-row"
          onMouseEnter={() => setHoveredBar(i)}
          onMouseLeave={() => setHoveredBar(null)}
          style={{ cursor: 'pointer' }}
        >
          <span className="mini-bar-label">{bar.label}</span>
          <div className="mini-bar" style={{ width: `${bar.percent}%`, background: bar.color, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          <span className="mini-bar-val">
            {hoveredBar === i ? formatCurrency(bar.amount) : `${bar.percent}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

// Icons
function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function SpendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function DeficitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19V5" /><path d="M5 12l7 7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
