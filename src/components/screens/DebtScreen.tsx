/**
 * Debt Screen - National Debt Tracker
 * Real-time national debt visualization with data from Treasury API
 * Source: fiscaldata.treasury.gov
 */

import { useState, useEffect, useMemo } from 'react';
import { fetchCurrentDebt } from '../../services/treasuryApi';
import { formatTrillions, formatBillions, formatMillions, formatDebtLive } from '../../utils/format';
import { ChartContainer, LinePath, AreaFill, Crosshair, Tooltip, GridLines, BarGroup } from '../charts';
import { linearScale, niceExtent } from '../../utils/chart';
import type { Point } from '../../utils/chart';
import { formatCurrency } from '../../utils/format';

// Historical debt data (fallback if API fails)
const DEBT_HISTORY = [
  { year: 1990, debt: 3.23e12 },
  { year: 1995, debt: 4.97e12 },
  { year: 2000, debt: 5.67e12 },
  { year: 2005, debt: 7.93e12 },
  { year: 2008, debt: 10.02e12 },
  { year: 2010, debt: 13.56e12 },
  { year: 2012, debt: 16.07e12 },
  { year: 2015, debt: 18.15e12 },
  { year: 2017, debt: 20.24e12 },
  { year: 2019, debt: 22.72e12 },
  { year: 2020, debt: 27.75e12 },
  { year: 2021, debt: 29.62e12 },
  { year: 2022, debt: 31.42e12 },
  { year: 2023, debt: 33.17e12 },
  { year: 2024, debt: 35.46e12 },
  { year: 2025, debt: 36.22e12 },
];

const INTEREST_HISTORY = [
  { year: 2015, interest: 223e9 },
  { year: 2016, interest: 240e9 },
  { year: 2017, interest: 263e9 },
  { year: 2018, interest: 325e9 },
  { year: 2019, interest: 375e9 },
  { year: 2020, interest: 345e9 },
  { year: 2021, interest: 352e9 },
  { year: 2022, interest: 475e9 },
  { year: 2023, interest: 659e9 },
  { year: 2024, interest: 882e9 },
  { year: 2025, interest: 968e9 },
];

const POPULATION = 335000000;
const TAXPAYERS = 150000000;

type MetricView = 'total' | 'percapita' | 'interest';
type TimePeriod = '5y' | '10y' | '20y' | 'all';

export function DebtScreen() {
  const [liveDebt, setLiveDebt] = useState(36.22e12);
  const [publicDebt, setPublicDebt] = useState(28.2e12);
  const [intragovDebt, setIntragovDebt] = useState(7.2e12);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricView>('total');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('10y');
  const [chartExpanded, setChartExpanded] = useState(false);

  useEffect(() => {
    async function loadDebtData() {
      setIsLoading(true);
      const data = await fetchCurrentDebt();
      if (data) {
        setLiveDebt(data.totalDebt);
        setPublicDebt(data.publicDebt);
        setIntragovDebt(data.intragovernmentalDebt);
        setLastUpdated(data.recordDate);
      }
      setIsLoading(false);
    }
    loadDebtData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveDebt(prev => prev + 95000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let yearsBack = 100;
    if (timePeriod === '5y') yearsBack = 5;
    if (timePeriod === '10y') yearsBack = 10;
    if (timePeriod === '20y') yearsBack = 20;
    return DEBT_HISTORY.filter(d => d.year >= currentYear - yearsBack);
  }, [timePeriod]);

  const debtPerCitizen = liveDebt / POPULATION;
  const debtPerTaxpayer = liveDebt / TAXPAYERS;
  const interestPerYear = 968e9;
  const interestPerDay = interestPerYear / 365;
  const interestPerSecond = interestPerDay / 86400;
  const gdpRatio = 124;

  const fiveYearGrowth = ((liveDebt - DEBT_HISTORY.find(d => d.year === 2019)!.debt) / DEBT_HISTORY.find(d => d.year === 2019)!.debt * 100);
  const tenYearGrowth = ((liveDebt - DEBT_HISTORY.find(d => d.year === 2015)!.debt) / DEBT_HISTORY.find(d => d.year === 2015)!.debt * 100);

  return (
    <div className="screen debt-screen">
      <header className="screen-header">
        <h1 className="header-title">National Debt</h1>
        <button className="icon-btn" onClick={() => setChartExpanded(!chartExpanded)}>
          {chartExpanded ? <CollapseIcon /> : <ExpandIcon />}
        </button>
      </header>

      <div className="screen-content">
        {/* Live Debt Counter */}
        <div className="card debt-counter-card">
          <div className="debt-label">U.S. National Debt</div>
          <div className="debt-amount">
            {isLoading ? 'Loading...' : `$${formatDebtLive(liveDebt)}`}
          </div>
          <div className="debt-live-indicator">
            <span className="live-dot"></span>
            <span>Live • +${Math.round(interestPerSecond).toLocaleString()}/sec</span>
          </div>
          {lastUpdated && (
            <div className="debt-source">
              Source: Treasury.gov • {new Date(lastUpdated).toLocaleDateString()}
            </div>
          )}

          {/* Debt Chart - Interactive */}
          <div className={`debt-chart ${chartExpanded ? 'expanded' : ''}`}>
            <div className="chart-time-selector">
              {(['5y', '10y', '20y', 'all'] as const).map(period => (
                <button
                  key={period}
                  className={`time-btn ${timePeriod === period ? 'active' : ''}`}
                  onClick={() => setTimePeriod(period)}
                >
                  {period === 'all' ? 'All' : period.toUpperCase()}
                </button>
              ))}
            </div>
            <DebtHistoryChart data={chartData} expanded={chartExpanded} />

            <div className="growth-stats">
              <div className="growth-stat">
                <span className="growth-value negative">+{fiveYearGrowth.toFixed(0)}%</span>
                <span className="growth-label">5-Year Growth</span>
              </div>
              <div className="growth-stat">
                <span className="growth-value negative">+{tenYearGrowth.toFixed(0)}%</span>
                <span className="growth-label">10-Year Growth</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="metric-selector">
          <button className={`metric-btn ${selectedMetric === 'total' ? 'active' : ''}`} onClick={() => setSelectedMetric('total')}>Total</button>
          <button className={`metric-btn ${selectedMetric === 'percapita' ? 'active' : ''}`} onClick={() => setSelectedMetric('percapita')}>Per Capita</button>
          <button className={`metric-btn ${selectedMetric === 'interest' ? 'active' : ''}`} onClick={() => setSelectedMetric('interest')}>Interest</button>
        </div>

        {/* Dynamic Metrics Display */}
        {selectedMetric === 'total' && (
          <div className="section">
            <span className="section-title">Total Debt Breakdown</span>
            <div className="card metrics-card">
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon total"><TotalIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Gross National Debt</span>
                    <span className="metric-desc">Total federal obligations</span>
                  </div>
                </div>
                <span className="metric-value negative">${formatTrillions(liveDebt)}</span>
              </div>
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon public"><PublicIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Debt Held by Public</span>
                    <span className="metric-desc">{((publicDebt / liveDebt) * 100).toFixed(0)}% of total</span>
                  </div>
                </div>
                <span className="metric-value">${formatTrillions(publicDebt)}</span>
              </div>
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon intra"><IntraIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Intragovernmental</span>
                    <span className="metric-desc">Owed to govt. accounts</span>
                  </div>
                </div>
                <span className="metric-value">${formatTrillions(intragovDebt)}</span>
              </div>
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-icon gdp"><GDPIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Debt-to-GDP Ratio</span>
                    <span className="metric-desc">Economic indicator</span>
                  </div>
                </div>
                <span className="metric-value warning">{gdpRatio}%</span>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'percapita' && (
          <div className="section">
            <span className="section-title">Per Capita Breakdown</span>
            <div className="card metrics-card">
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon citizen"><CitizenIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Debt per Citizen</span>
                    <span className="metric-desc">All 335M Americans</span>
                  </div>
                </div>
                <span className="metric-value negative">${Math.round(debtPerCitizen).toLocaleString()}</span>
              </div>
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon taxpayer"><TaxpayerIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Debt per Taxpayer</span>
                    <span className="metric-desc">~150M taxpayers</span>
                  </div>
                </div>
                <span className="metric-value negative">${Math.round(debtPerTaxpayer).toLocaleString()}</span>
              </div>
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon household"><HouseholdIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Debt per Household</span>
                    <span className="metric-desc">~130M households</span>
                  </div>
                </div>
                <span className="metric-value negative">${Math.round(liveDebt / 130000000).toLocaleString()}</span>
              </div>
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-icon baby"><BabyIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Debt per Newborn</span>
                    <span className="metric-desc">Born with this share</span>
                  </div>
                </div>
                <span className="metric-value negative">${Math.round(debtPerCitizen).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'interest' && (
          <div className="section">
            <span className="section-title">Interest Payments</span>
            <div className="card metrics-card">
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon interest-year"><InterestIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Interest per Year</span>
                    <span className="metric-desc">FY2025 estimate</span>
                  </div>
                </div>
                <span className="metric-value negative">${formatBillions(interestPerYear)}</span>
              </div>
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon interest-day"><DayIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Interest per Day</span>
                    <span className="metric-desc">Every single day</span>
                  </div>
                </div>
                <span className="metric-value negative">${formatBillions(interestPerDay)}</span>
              </div>
              <div className="metric-row border-b">
                <div className="metric-info">
                  <span className="metric-icon interest-hour"><HourIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">Interest per Hour</span>
                    <span className="metric-desc">Every hour</span>
                  </div>
                </div>
                <span className="metric-value negative">${formatMillions(interestPerDay / 24)}</span>
              </div>
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-icon interest-percent"><PercentIcon /></span>
                  <div className="metric-details">
                    <span className="metric-name">% of Federal Budget</span>
                    <span className="metric-desc">Just for interest</span>
                  </div>
                </div>
                <span className="metric-value warning">13%</span>
              </div>
            </div>

            {/* Interest trend chart - Interactive */}
            <div className="card interest-trend-card">
              <h3 className="trend-title">Interest Payment Trend</h3>
              <InterestTrendChart data={INTEREST_HISTORY} />
              <p className="trend-note">Interest costs have more than doubled since 2020</p>
            </div>
          </div>
        )}

        {/* Context */}
        <div className="section">
          <span className="section-title">What This Means</span>
          <div className="card context-card">
            {selectedMetric === 'total' && (
              <p className="context-text">
                The national debt has grown from <strong>$5.7T in 2000</strong> to <strong>${formatTrillions(liveDebt)} today</strong> —
                a {Math.round((liveDebt / 5.67e12 - 1) * 100)}% increase. At the current rate,
                it increases by approximately <strong>$1 trillion</strong> every 100 days.
              </p>
            )}
            {selectedMetric === 'percapita' && (
              <p className="context-text">
                If the debt were divided equally, every American would owe <strong>${Math.round(debtPerCitizen).toLocaleString()}</strong>.
                A family of four would owe <strong>${(Math.round(debtPerCitizen) * 4).toLocaleString()}</strong>.
                This doesn't include state and local debt.
              </p>
            )}
            {selectedMetric === 'interest' && (
              <p className="context-text">
                Interest payments are now the <strong>4th largest</strong> federal expenditure — more than we spend on
                veterans, education, or transportation combined. By 2028, interest is projected to exceed <strong>$1 trillion/year</strong>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Interactive Debt History Chart with crosshair + tooltip
function DebtHistoryChart({ data, expanded }: { data: Array<{ year: number; debt: number }>; expanded: boolean }) {
  const chartHeight = expanded ? 300 : 200;

  return (
    <ChartContainer
      height={chartHeight}
      margins={{ top: 15, right: 15, bottom: 25, left: 45 }}
      dataLength={data.length}
      ariaLabel="National debt history chart"
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
        const prevDebt = nearestIndex > 0 ? data[nearestIndex - 1].debt : null;
        const yoyChange = prevDebt ? ((hovered.debt - prevDebt) / prevDebt * 100) : 0;

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
            <LinePath data={points} color="#ef4444" smooth strokeWidth={2.5} />

            {/* End dot */}
            <circle
              cx={points[points.length - 1]?.x}
              cy={points[points.length - 1]?.y}
              r={5}
              fill="#ef4444"
              stroke="var(--bg-surface-1)"
              strokeWidth={2.5}
            />

            {/* Year labels */}
            {data.filter((_, i) => {
              if (data.length <= 5) return true;
              if (data.length <= 10) return i % 2 === 0 || i === data.length - 1;
              return i % 3 === 0 || i === data.length - 1;
            }).map(d => {
              const idx = data.indexOf(d);
              return (
                <text key={d.year} x={xScale(idx)} y={margins.top + innerHeight + 16} className="chart-x-label" textAnchor="middle">
                  {d.year}
                </text>
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
                  <div className="chart-tooltip-value">{hovered.year}</div>
                  <div className="chart-tooltip-row">{formatCurrency(hovered.debt)}</div>
                  {prevDebt && (
                    <div className={`chart-tooltip-change ${yoyChange >= 0 ? 'negative' : 'positive'}`}>
                      {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}% YoY
                    </div>
                  )}
                </Tooltip>
              </>
            )}
          </>
        );
      }}
    </ChartContainer>
  );
}

// Interactive Interest Trend Chart
function InterestTrendChart({ data }: { data: Array<{ year: number; interest: number }> }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <ChartContainer
      height={140}
      margins={{ top: 10, right: 10, bottom: 25, left: 10 }}
      dataLength={data.length}
      ariaLabel="Interest payment trend chart"
    >
      {({ innerWidth, innerHeight, margins, isHovering, nearestIndex }) => {
        const maxVal = Math.max(...data.map(d => d.interest)) * 1.1;
        const activeIdx = isHovering ? nearestIndex : hoveredIdx;

        const barData = data.map((d, i) => ({
          label: d.year.toString().slice(-2),
          values: [{
            value: d.interest,
            color: i === data.length - 1 ? '#ef4444' : '#fbbf24',
          }],
        }));

        return (
          <>
            <BarGroup
              data={barData}
              innerWidth={innerWidth}
              innerHeight={innerHeight}
              margins={margins}
              maxValue={maxVal}
              hoveredIndex={activeIdx}
              onHover={setHoveredIdx}
              animate
            />
            {activeIdx !== null && activeIdx >= 0 && activeIdx < data.length && (
              <Tooltip
                x={margins.left + (activeIdx / data.length) * innerWidth + innerWidth / data.length / 2}
                y={margins.top}
                visible
                containerWidth={margins.left + innerWidth + margins.right}
              >
                <div className="chart-tooltip-value">{data[activeIdx].year}</div>
                <div className="chart-tooltip-row">{formatCurrency(data[activeIdx].interest)}</div>
                {activeIdx > 0 && (
                  <div className={`chart-tooltip-change ${data[activeIdx].interest >= data[activeIdx - 1].interest ? 'negative' : 'positive'}`}>
                    {((data[activeIdx].interest - data[activeIdx - 1].interest) / data[activeIdx - 1].interest * 100).toFixed(0)}% YoY
                  </div>
                )}
              </Tooltip>
            )}
          </>
        );
      }}
    </ChartContainer>
  );
}

// Icons
function ExpandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 3 21 3 21 9"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 14 10 14 10 20"/>
      <polyline points="20 10 14 10 14 4"/>
      <line x1="14" y1="10" x2="21" y2="3"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  );
}

function TotalIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>; }
function PublicIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IntraIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-4h6v4"/></svg>; }
function GDPIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>; }
function CitizenIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function TaxpayerIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14.5" x2="15" y2="14.5"/></svg>; }
function HouseholdIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function BabyIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>; }
function InterestIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function DayIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>; }
function HourIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function PercentIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>; }
