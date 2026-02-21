/**
 * Desktop Top Navbar — spending.wtf
 * Visible on tablet+ (>=768px), hidden on mobile
 */

import type { TabId, SubScreen } from '../types';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onNavigate?: (subScreen: SubScreen) => void;
}

export function Navbar({ activeTab, onTabChange, onNavigate }: NavbarProps) {
  const goHome = () => onTabChange('dashboard');
  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={goHome} style={{ cursor: 'pointer' }}>
        spending<span className="logo-accent">.wtf</span>
      </div>
      <div className="navbar-links">
        <button
          className={`navbar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <DashboardIcon />
          Overview
        </button>
        <button
          className={`navbar-link ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => onTabChange('subscriptions')}
        >
          <ProgramsIcon />
          Programs
        </button>
        <button
          className={`navbar-link ${activeTab === 'spending' ? 'active' : ''}`}
          onClick={() => onTabChange('spending')}
        >
          <SpendingIcon />
          Spending
        </button>
        <button
          className={`navbar-link ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => onTabChange('transactions')}
        >
          <DebtIcon />
          Debt
        </button>
        <button
          className={`navbar-link ${activeTab === 'debt' ? 'active' : ''}`}
          onClick={() => onTabChange('debt')}
        >
          <MoreIcon />
          More
        </button>
      </div>
      <button className="navbar-search-btn" onClick={() => onNavigate?.('search')} aria-label="Search">
        <SearchIcon />
      </button>
    </nav>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ProgramsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function SpendingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function DebtIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
