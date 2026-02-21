/**
 * Recurring Screen - Government Programs
 * Shows recurring federal programs and their costs with animated comparison bars
 */

import { useState } from 'react';
import { getGovernmentSubscriptions } from '../../services/usaspending';
import { formatTrillions, formatBillions, formatCurrency } from '../../utils/format';

interface RecurringScreenProps {
  data: {
    programs: Array<{
      name: string;
      annualCost: number;
      frequency: string;
      trend: 'up' | 'down' | 'stable';
      category: string;
      icon?: string;
    }>;
  };
}

export function RecurringScreen({ data }: RecurringScreenProps) {
  const [activeTab, setActiveTab] = useState<'mandatory' | 'discretionary'>('mandatory');
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const subscriptions = getGovernmentSubscriptions();
  const enrichedPrograms = data.programs.map(p => {
    const sub = subscriptions.find(s => p.name.includes(s.name) || s.name.includes(p.name));
    return {
      ...p,
      description: sub?.description || '',
      trendAmount: sub?.trendAmount || 0,
    };
  });

  const mandatoryPrograms = enrichedPrograms.filter(p =>
    ['Social Security', 'Medicare', 'Medicaid', 'Interest on Debt', 'Veterans Benefits'].some(m => p.name.includes(m))
  );

  const discretionaryPrograms = enrichedPrograms.filter(p => !mandatoryPrograms.includes(p));

  const displayPrograms = activeTab === 'mandatory' ? mandatoryPrograms : discretionaryPrograms;
  const totalCost = displayPrograms.reduce((sum, p) => sum + p.annualCost, 0);
  const allMandatory = mandatoryPrograms.reduce((sum, p) => sum + p.annualCost, 0);
  const allDiscretionary = discretionaryPrograms.reduce((sum, p) => sum + p.annualCost, 0);
  const mandatoryPct = (allMandatory / (allMandatory + allDiscretionary)) * 100;
  const discretionaryPct = (allDiscretionary / (allMandatory + allDiscretionary)) * 100;

  return (
    <div className="screen recurring-screen">
      <header className="screen-header">
        <h1 className="header-title">Programs</h1>
        <button className="icon-btn add-btn" onClick={() => setShowInfoCard(!showInfoCard)}>
          <InfoIcon />
        </button>
      </header>

      {showInfoCard && (
        <div className="card info-card" style={{ margin: '0 0 12px' }}>
          <p className="info-text" style={{ margin: 0, fontSize: '13px' }}>
            <strong>Mandatory spending</strong> is required by law (Social Security, Medicare, etc.)
            and runs automatically without annual votes — about 63% of the budget.<br /><br />
            <strong>Discretionary spending</strong> is set annually by Congress through appropriations
            bills — including defense, education, and transportation.
          </p>
          <button className="text-btn" onClick={() => setShowInfoCard(false)} style={{ marginTop: '8px' }}>Dismiss</button>
        </div>
      )}

      <div className="tab-switcher">
        <button className={`tab-switch ${activeTab === 'mandatory' ? 'active' : ''}`} onClick={() => setActiveTab('mandatory')}>Mandatory</button>
        <button className={`tab-switch ${activeTab === 'discretionary' ? 'active' : ''}`} onClick={() => setActiveTab('discretionary')}>Discretionary</button>
      </div>

      <div className="screen-content">
        <div className="card calendar-card">
          <div className="calendar-header">
            <h2 className="calendar-title">
              {activeTab === 'mandatory' ? 'Mandatory Spending' : 'Discretionary Spending'}
            </h2>
            <button className="icon-btn expand-btn" onClick={() => setShowExpanded(!showExpanded)}>
              <ExpandIcon />
            </button>
          </div>
          <p className="calendar-subtitle">
            {activeTab === 'mandatory'
              ? 'Programs required by law. Congress cannot easily change these.'
              : 'Programs funded through annual appropriations bills.'}
          </p>

          <div className="total-cost-banner">
            <span className="total-label">FY2025 Total</span>
            <span className="total-amount">${formatTrillions(totalCost)}</span>
          </div>

          {/* Animated comparison bars with hover */}
          {showExpanded && (
            <div className="expanded-comparison">
              <div
                className="comparison-row"
                onMouseEnter={() => setHoveredBar('mandatory')}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: 'pointer' }}
              >
                <span className="comparison-label">Mandatory</span>
                <div className="comparison-bar-bg">
                  <div
                    className="comparison-bar mandatory-bar"
                    style={{
                      width: `${mandatoryPct}%`,
                      opacity: hoveredBar === null || hoveredBar === 'mandatory' ? 1 : 0.4,
                    }}
                  />
                </div>
                <span className="comparison-value">
                  {hoveredBar === 'mandatory' ? `${mandatoryPct.toFixed(0)}%` : `$${formatTrillions(allMandatory)}`}
                </span>
              </div>
              <div
                className="comparison-row"
                onMouseEnter={() => setHoveredBar('discretionary')}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: 'pointer' }}
              >
                <span className="comparison-label">Discretionary</span>
                <div className="comparison-bar-bg">
                  <div
                    className="comparison-bar discretionary-bar"
                    style={{
                      width: `${discretionaryPct}%`,
                      opacity: hoveredBar === null || hoveredBar === 'discretionary' ? 1 : 0.4,
                    }}
                  />
                </div>
                <span className="comparison-value">
                  {hoveredBar === 'discretionary' ? `${discretionaryPct.toFixed(0)}%` : `$${formatTrillions(allDiscretionary)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'mandatory' && (
          <div className="card warning-card">
            <div className="warning-content">
              <span className="warning-icon"><AutopilotIcon /></span>
              <div className="warning-text">
                <strong>On Autopilot</strong>
                <p>These programs run automatically without annual votes. They make up ~63% of all spending.</p>
              </div>
            </div>
          </div>
        )}

        <div className="section">
          <span className="section-title">Programs ({displayPrograms.length})</span>
          <div className="card bills-card">
            {displayPrograms.map((program, i) => (
              <div key={i}>
                <div
                  className={`bill-row ${i < displayPrograms.length - 1 ? 'border-b' : ''} clickable`}
                  onClick={() => setExpandedProgram(expandedProgram === program.name ? null : program.name)}
                >
                  <div className="bill-info">
                    <span className={`bill-icon ${program.category}`}>
                      {getProgramIcon(program.name)}
                    </span>
                    <div className="bill-details">
                      <span className="bill-name">{program.name}</span>
                      <span className="bill-date">{program.frequency}</span>
                    </div>
                  </div>
                  <div className="bill-amount-wrap">
                    <span className="bill-amount">${formatBillions(program.annualCost)}</span>
                    <TrendIcon trend={program.trend} />
                  </div>
                </div>

                {expandedProgram === program.name && (
                  <div className="program-expanded">
                    {program.description && (
                      <p className="program-desc">{program.description}</p>
                    )}
                    <div className="program-stats">
                      <div className="program-stat">
                        <span className="program-stat-label">Annual</span>
                        <span className="program-stat-value">{formatCurrency(program.annualCost)}</span>
                      </div>
                      <div className="program-stat">
                        <span className="program-stat-label">Monthly</span>
                        <span className="program-stat-value">{formatCurrency(program.annualCost / 12)}</span>
                      </div>
                      <div className="program-stat">
                        <span className="program-stat-label">Daily</span>
                        <span className="program-stat-value">{formatCurrency(program.annualCost / 365)}</span>
                      </div>
                      {program.trendAmount !== 0 && (
                        <div className="program-stat">
                          <span className="program-stat-label">YoY Change</span>
                          <span className={`program-stat-value ${program.trendAmount > 0 ? 'negative' : 'positive'}`}>
                            {program.trendAmount > 0 ? '+' : ''}{program.trendAmount}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getProgramIcon(name: string) {
  if (name.includes('Social Security')) return <SocialSecurityIcon />;
  if (name.includes('Medicare')) return <MedicareIcon />;
  if (name.includes('Medicaid')) return <MedicaidIcon />;
  if (name.includes('Defense')) return <DefenseIcon />;
  if (name.includes('Interest')) return <InterestIcon />;
  if (name.includes('Veterans')) return <VeteransIcon />;
  if (name.includes('Education')) return <EducationIcon />;
  return <DefaultProgramIcon />;
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
  if (trend === 'down') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>;
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M5 12h14" /></svg>;
}

// Icons
function InfoIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>; }
function ExpandIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>; }
function AutopilotIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>; }
function SocialSecurityIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function MedicareIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>; }
function MedicaidIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>; }
function DefenseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
function InterestIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>; }
function VeteransIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>; }
function EducationIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>; }
function DefaultProgramIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>; }
