/**
 * Methodology Screen — Data sources and calculation methods
 */

import { SubScreenHeader } from '../SubScreenHeader';

interface MethodologyScreenProps {
  onBack: () => void;
}

export function MethodologyScreen({ onBack }: MethodologyScreenProps) {
  return (
    <div className="screen sub-screen">
      <SubScreenHeader title="Methodology" onBack={onBack} />
      <div className="screen-content">
        {/* Overview */}
        <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 400, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: '0 0 8px' }}>How We Get Our Data</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            spending.wtf aggregates data from official U.S. government APIs to provide a clear picture
            of federal spending, revenue, and debt. All data is fetched in real-time when available, with
            fallback estimates based on the most recent official figures.
          </p>
        </div>

        {/* Data sources */}
        <div className="section">
          <span className="section-title">Primary Data Sources</span>
          <div className="card">
            <SourceItem
              name="Treasury Fiscal Data API"
              url="https://fiscaldata.treasury.gov/api-documentation/"
              description="National debt (debt to the penny), historical debt outstanding, interest expense, Monthly Treasury Statements (revenue & spending), and average interest rates."
            />
            <SourceItem
              name="USAspending.gov API"
              url="https://api.usaspending.gov"
              description="Agency-level spending, state-level awards, award search, spending by category, and top contractors. The official source for all U.S. government spending data."
              isLast={false}
            />
            <SourceItem
              name="Congressional Budget Office"
              url="https://www.cbo.gov"
              description="Budget projections, economic forecasts, and long-term fiscal outlook used for context and trend analysis."
              isLast
            />
          </div>
        </div>

        {/* Calculations */}
        <div className="section">
          <span className="section-title">Calculations</span>
          <div className="card" style={{ padding: '16px' }}>
            <CalcItem
              title="Real-time Debt Counter"
              detail="Based on the latest Treasury debt-to-the-penny figure, incremented by approximately $95,000/second based on the annual deficit rate (~$3T/year)."
            />
            <CalcItem
              title="Per Capita Figures"
              detail="Total amounts divided by U.S. population (~335M). Per-taxpayer uses ~150M. Per-household uses ~130M. Population figures from Census Bureau estimates."
            />
            <CalcItem
              title="Year-over-Year Changes"
              detail="Calculated as (current - previous) / previous * 100. Uses matching fiscal year periods (Oct 1 - Sep 30)."
            />
            <CalcItem
              title="Revenue Breakdown"
              detail="From Monthly Treasury Statements (MTS) Table 4, categorized by source: individual income taxes, social insurance, corporate taxes, excise taxes, customs, and other."
              isLast
            />
          </div>
        </div>

        {/* Caveats */}
        <div className="section">
          <span className="section-title">Important Notes</span>
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
              <strong>Estimates vs. Actuals:</strong> Current fiscal year data may be based on projections
              until final figures are published by Treasury (typically October for the prior FY).
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
              <strong>Rounding:</strong> Large dollar amounts are rounded for readability. Exact figures
              are available from the source APIs.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <strong>Not affiliated:</strong> This app is not affiliated with or endorsed by any
              U.S. government agency. It is an independent data visualization project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceItem({ name, url, description, isLast = false }: {
  name: string; url: string; description: string; isLast?: boolean;
}) {
  return (
    <div className={`${!isLast ? 'border-b' : ''}`} style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontWeight: 400, fontFamily: 'var(--font-heading)', fontSize: '15px', color: 'var(--text-primary)' }}>{name}</span>
        <button
          style={{ fontSize: '12px', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          View API →
        </button>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{description}</p>
    </div>
  );
}

function CalcItem({ title, detail, isLast = false }: { title: string; detail: string; isLast?: boolean }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : '12px' }}>
      <div style={{ fontWeight: 400, fontFamily: 'var(--font-heading)', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{detail}</p>
    </div>
  );
}
