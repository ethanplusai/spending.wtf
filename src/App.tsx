/**
 * spending.wtf — Federal Spending Tracker
 * Responsive web app: navbar on desktop, tab bar on mobile
 */

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TabBar } from './components/TabBar';
import {
  DashboardScreen,
  RecurringScreen,
  SpendingScreen,
  DebtScreen,
  MenuScreen,
  AgencyListScreen,
  AgencyDetailScreen,
  StateListScreen,
  StateDetailScreen,
  HistoricalScreen,
  CompareYearsScreen,
  RevenueBreakdownScreen,
  MethodologyScreen,
  SearchScreen,
  SpendingTreemapScreen,
  RevenueVsSpendingScreen,
  InterestRatesScreen,
  JourneyScreen,
} from './components/screens';

import type { TabId, SubScreen } from './types';
import './styles/index.css';

// Government spending data (FY2025 estimates — fallback)
const govData = {
  dashboard: {
    fiscalYear: 2025,
    totalSpending: 7.0e12,
    totalRevenue: 5.05e12,
    deficit: 1.95e12,
    dailySpending: 19.2e9,
    perCapita: 20900,
  },
  recurring: {
    programs: [
      { name: 'Social Security', annualCost: 1.54e12, frequency: 'Mandatory', trend: 'up' as const, category: 'social' },
      { name: 'Medicare', annualCost: 900e9, frequency: 'Mandatory', trend: 'up' as const, category: 'health' },
      { name: 'Medicaid', annualCost: 650e9, frequency: 'Mandatory', trend: 'up' as const, category: 'health' },
      { name: 'Interest on Debt', annualCost: 968e9, frequency: 'Mandatory', trend: 'up' as const, category: 'interest' },
      { name: 'Veterans Benefits', annualCost: 351e9, frequency: 'Mandatory', trend: 'up' as const, category: 'veterans' },
      { name: 'Defense (DoD)', annualCost: 895e9, frequency: 'Discretionary', trend: 'up' as const, category: 'defense' },
      { name: 'Education', annualCost: 98e9, frequency: 'Discretionary', trend: 'down' as const, category: 'education' },
      { name: 'Transportation', annualCost: 115e9, frequency: 'Discretionary', trend: 'stable' as const, category: 'transport' },
      { name: 'Housing & Urban Dev', annualCost: 75e9, frequency: 'Discretionary', trend: 'stable' as const, category: 'housing' },
      { name: 'Energy', annualCost: 52e9, frequency: 'Discretionary', trend: 'up' as const, category: 'energy' },
    ],
  },
  menu: {
    lastUpdated: new Date().toLocaleDateString(),
    dataSource: 'USAspending.gov',
  },
};

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [subScreen, setSubScreen] = useState<SubScreen | null>('journey');
  const [subScreenParams, setSubScreenParams] = useState<Record<string, string | number>>({});

  const navigate = useCallback((screen: SubScreen, params?: Record<string, string | number>) => {
    setSubScreen(screen);
    setSubScreenParams(params || {});
  }, []);

  const goBack = useCallback(() => {
    setSubScreen(null);
    setSubScreenParams({});
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setSubScreen(null);
    setSubScreenParams({});
  }, []);

  // Cmd+K / Ctrl+K global search shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const renderSubScreen = () => {
    switch (subScreen) {
      case 'agency-list':
        return <AgencyListScreen onBack={goBack} onNavigate={navigate} />;
      case 'agency-detail':
        return <AgencyDetailScreen onBack={goBack} params={subScreenParams} />;
      case 'state-list':
        return <StateListScreen onBack={goBack} onNavigate={navigate} />;
      case 'state-detail':
        return <StateDetailScreen onBack={goBack} params={subScreenParams} />;
      case 'historical':
        return <HistoricalScreen onBack={goBack} />;
      case 'compare-years':
        return <CompareYearsScreen onBack={goBack} />;
      case 'revenue-breakdown':
        return <RevenueBreakdownScreen onBack={goBack} />;
      case 'search':
        return <SearchScreen onBack={goBack} />;
      case 'methodology':
        return <MethodologyScreen onBack={goBack} />;
      case 'spending-treemap':
        return <SpendingTreemapScreen onBack={goBack} />;
      case 'revenue-vs-spending':
        return <RevenueVsSpendingScreen onBack={goBack} />;
      case 'interest-rates':
        return <InterestRatesScreen onBack={goBack} />;
      case 'journey':
        return <JourneyScreen onBack={goBack} onNavigate={navigate} onTabChange={handleTabChange} />;
      default:
        return null;
    }
  };

  const renderScreen = () => {
    // Sub-screen takes priority
    if (subScreen) {
      const subScreenContent = renderSubScreen();
      if (subScreenContent) return subScreenContent;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            data={govData.dashboard}
            onNavigate={navigate}
            onTabChange={handleTabChange}
          />
        );
      case 'subscriptions':
        return <RecurringScreen data={govData.recurring} />;
      case 'spending':
        return (
          <SpendingScreen
            onNavigate={navigate}
            onTabChange={handleTabChange}
          />
        );
      case 'transactions':
        return <DebtScreen />;
      case 'debt':
        return (
          <MenuScreen
            data={govData.menu}
            onNavigate={navigate}
            onRefresh={() => {
              // Trigger global refresh if needed
              govData.menu.lastUpdated = new Date().toLocaleDateString();
            }}
          />
        );
      default:
        return (
          <DashboardScreen
            data={govData.dashboard}
            onNavigate={navigate}
            onTabChange={handleTabChange}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} onNavigate={navigate} />
      <main className="main-content">
        <div className="content-container">
          {renderScreen()}
        </div>
      </main>
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;
