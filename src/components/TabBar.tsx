/**
 * Bottom Tab Navigation
 * Government spending tracker tab bar
 */

import type { TabId } from '../types';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      <TabItem
        id="dashboard"
        label="Overview"
        icon={<DashboardIcon />}
        isActive={activeTab === 'dashboard'}
        onClick={() => onTabChange('dashboard')}
      />
      <TabItem
        id="subscriptions"
        label="Programs"
        icon={<ProgramsIcon />}
        isActive={activeTab === 'subscriptions'}
        onClick={() => onTabChange('subscriptions')}
      />
      <TabItem
        id="spending"
        label="Spending"
        icon={<SpendingIcon />}
        isActive={activeTab === 'spending'}
        onClick={() => onTabChange('spending')}
      />
      <TabItem
        id="transactions"
        label="Debt"
        icon={<DebtIcon />}
        isActive={activeTab === 'transactions'}
        onClick={() => onTabChange('transactions')}
      />
      <TabItem
        id="debt"
        label="More"
        icon={<MoreIcon />}
        isActive={activeTab === 'debt'}
        onClick={() => onTabChange('debt')}
      />
    </nav>
  );
}

interface TabItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function TabItem({ label, icon, isActive, onClick }: TabItemProps) {
  return (
    <button
      className={`tab-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="tab-icon">{icon}</span>
      <span className="tab-label">{label}</span>
      {isActive && <span className="tab-indicator" />}
    </button>
  );
}

// SVG Icons
function DashboardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ProgramsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function SpendingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function DebtIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20V10"/>
      <path d="M18 20V4"/>
      <path d="M6 20v-4"/>
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
