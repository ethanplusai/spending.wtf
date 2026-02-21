/**
 * Type definitions for Government Money Tracker
 * "Rocket Money for U.S. Government Spending"
 */

// ============================================
// Spending Categories
// ============================================

export interface SpendingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentOfTotal: number;
  change?: number; // Year over year change percentage
  subItems?: SpendingItem[];
}

export interface SpendingItem {
  id: string;
  name: string;
  amount: number;
  agency?: string;
  description?: string;
}

// ============================================
// Government "Subscriptions"
// ============================================

export interface GovernmentSubscription {
  id: string;
  name: string;
  icon: string;
  annualCost: number;
  frequency: 'Annual' | 'Ongoing' | 'Monthly';
  trend: 'up' | 'down' | 'stable';
  trendAmount?: number;
  description: string;
  category: string;
}

// ============================================
// Dashboard Data
// ============================================

export interface DashboardData {
  fiscalYear: number;
  totalSpending: number;
  totalRevenue: number;
  deficit: number;
  previousYearSpending: number;
  yearOverYearChange: number;
  categories: SpendingCategory[];
}

// ============================================
// National Debt
// ============================================

export interface NationalDebtData {
  currentDebt: number;
  debtPerCitizen: number;
  debtPerTaxpayer: number;
  dailyIncrease: number;
  lastUpdated: string;
}

// ============================================
// Tab Types
// ============================================

export type TabId = 'dashboard' | 'spending' | 'subscriptions' | 'transactions' | 'debt';

export type SubScreen =
  | 'agency-list' | 'agency-detail'
  | 'state-list' | 'state-detail'
  | 'historical' | 'compare-years'
  | 'revenue-breakdown'
  | 'search' | 'methodology'
  | 'spending-treemap' | 'revenue-vs-spending' | 'interest-rates'
  | 'journey';

export interface NavigationState {
  activeTab: TabId;
  subScreen: SubScreen | null;
  params?: Record<string, string | number>;
}

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

// API response types
export interface AgencyListItem {
  agency_id: number;
  toptier_code: string;
  agency_name: string;
  active_fy: string;
  budget_authority_amount: number;
  obligated_amount: number;
  percentage_of_total_budget_authority: number;
}

export interface StateSpendingItem {
  shape_code: string;
  display_name: string;
  aggregated_amount: number;
  population: number;
  per_capita: number;
}

export interface AwardSearchResult {
  internal_id: string;
  Award_ID: string;
  Description: string;
  Award_Amount: number;
  Start_Date: string;
  End_Date: string;
  Recipient: string;
  Awarding_Agency: string;
  Award_Type: string;
}

export interface RevenueSource {
  source: string;
  amount: number;
  percent: number;
  color: string;
}

export interface MonthlyBudgetData {
  fiscalYear: number;
  totalRevenue: number;
  totalSpending: number;
  deficit: number;
  revenueByMonth: Array<{ month: number; amount: number }>;
  spendingByMonth: Array<{ month: number; amount: number }>;
}

// ============================================
// API Types (Reused from USAspending)
// ============================================

export interface RawAwardResult {
  generated_internal_id: string;
  Award_ID: string;
  Description: string;
  Award_Amount: number;
  Start_Date: string;
  Recipient: string;
  Awarding_Agency: string;
  Awarding_Sub_Agency: string;
}

// ============================================
// Fiscal Year Data
// ============================================

export const FISCAL_YEARS = [2024, 2023, 2022, 2021];

// Federal spending categories mapped from agency data
export const SPENDING_CATEGORY_MAP: Record<string, { name: string; icon: string; color: string }> = {
  defense: { name: 'Defense', icon: '🛡️', color: '#3b82f6' },
  healthcare: { name: 'Healthcare', icon: '🏥', color: '#10b981' },
  social_security: { name: 'Social Security', icon: '👴', color: '#f59e0b' },
  interest: { name: 'Interest on Debt', icon: '💳', color: '#ef4444' },
  veterans: { name: 'Veterans Affairs', icon: '🎖️', color: '#0ea5e9' },
  education: { name: 'Education', icon: '🎓', color: '#d97706' },
  transportation: { name: 'Transportation', icon: '🚗', color: '#6b7280' },
  agriculture: { name: 'Agriculture', icon: '🌾', color: '#10b981' },
  energy: { name: 'Energy', icon: '⚡', color: '#f59e0b' },
  other: { name: 'Other', icon: '📋', color: '#525252' }
};
