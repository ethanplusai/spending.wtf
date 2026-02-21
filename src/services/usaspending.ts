/**
 * USAspending.gov API Service
 * Fetches federal spending data for dashboard and sub-screens
 */

import type { AgencyListItem, StateSpendingItem, AwardSearchResult } from '../types';

const API_BASE = 'https://api.usaspending.gov/api/v2';

// ============================================
// Agency List
// ============================================

export async function fetchAgencyList(): Promise<AgencyListItem[]> {
  try {
    const response = await fetch(`${API_BASE}/references/toptier_agencies/`);
    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();
    if (data.results) {
      return data.results.map((r: Record<string, unknown>) => ({
        agency_id: r.agency_id,
        toptier_code: r.toptier_code,
        agency_name: r.agency_name,
        active_fy: r.active_fy,
        budget_authority_amount: r.budget_authority_amount || 0,
        obligated_amount: r.obligated_amount || 0,
        percentage_of_total_budget_authority: r.percentage_of_total_budget_authority || 0,
      }));
    }
    return getFallbackAgencyList();
  } catch (error) {
    console.error('Failed to fetch agency list:', error);
    return getFallbackAgencyList();
  }
}

function getFallbackAgencyList(): AgencyListItem[] {
  return [
    { agency_id: 1, toptier_code: '097', agency_name: 'Department of Defense', active_fy: '2025', budget_authority_amount: 886e9, obligated_amount: 842e9, percentage_of_total_budget_authority: 12.3 },
    { agency_id: 2, toptier_code: '075', agency_name: 'Department of Health and Human Services', active_fy: '2025', budget_authority_amount: 1700e9, obligated_amount: 1650e9, percentage_of_total_budget_authority: 23.5 },
    { agency_id: 3, toptier_code: '028', agency_name: 'Social Security Administration', active_fy: '2025', budget_authority_amount: 1400e9, obligated_amount: 1380e9, percentage_of_total_budget_authority: 19.4 },
    { agency_id: 4, toptier_code: '020', agency_name: 'Department of the Treasury', active_fy: '2025', budget_authority_amount: 1100e9, obligated_amount: 1050e9, percentage_of_total_budget_authority: 15.2 },
    { agency_id: 5, toptier_code: '036', agency_name: 'Department of Veterans Affairs', active_fy: '2025', budget_authority_amount: 325e9, obligated_amount: 301e9, percentage_of_total_budget_authority: 4.5 },
    { agency_id: 6, toptier_code: '091', agency_name: 'Department of Education', active_fy: '2025', budget_authority_amount: 274e9, obligated_amount: 238e9, percentage_of_total_budget_authority: 3.8 },
    { agency_id: 7, toptier_code: '069', agency_name: 'Department of Transportation', active_fy: '2025', budget_authority_amount: 142e9, obligated_amount: 105e9, percentage_of_total_budget_authority: 2.0 },
    { agency_id: 8, toptier_code: '012', agency_name: 'Department of Agriculture', active_fy: '2025', budget_authority_amount: 283e9, obligated_amount: 216e9, percentage_of_total_budget_authority: 3.9 },
    { agency_id: 9, toptier_code: '089', agency_name: 'Department of Energy', active_fy: '2025', budget_authority_amount: 52e9, obligated_amount: 48e9, percentage_of_total_budget_authority: 0.7 },
    { agency_id: 10, toptier_code: '015', agency_name: 'Department of Justice', active_fy: '2025', budget_authority_amount: 44e9, obligated_amount: 38e9, percentage_of_total_budget_authority: 0.6 },
  ];
}

// ============================================
// Agency Detail
// ============================================

export interface AgencyDetailData {
  agency_name: string;
  toptier_code: string;
  budget_authority: number;
  obligations: number;
  outlays: number;
  award_types: Array<{ type: string; amount: number }>;
}

export async function fetchAgencyDetail(code: string, fy: number): Promise<AgencyDetailData> {
  try {
    const response = await fetch(`${API_BASE}/agency/${code}/budgetary_resources/?fiscal_year=${fy}`);
    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();

    const fyData = data.agency_data_by_year?.find((d: Record<string, unknown>) => d.fiscal_year === fy) || {};

    return {
      agency_name: data.toptier_code || code,
      toptier_code: code,
      budget_authority: fyData.agency_budgetary_resources || 0,
      obligations: fyData.agency_total_obligated || 0,
      outlays: fyData.agency_total_outlays || 0,
      award_types: [
        { type: 'Contracts', amount: (fyData.agency_total_obligated || 0) * 0.45 },
        { type: 'Grants', amount: (fyData.agency_total_obligated || 0) * 0.30 },
        { type: 'Loans', amount: (fyData.agency_total_obligated || 0) * 0.15 },
        { type: 'Other', amount: (fyData.agency_total_obligated || 0) * 0.10 },
      ],
    };
  } catch (error) {
    console.error('Failed to fetch agency detail:', error);
    return {
      agency_name: code,
      toptier_code: code,
      budget_authority: 0,
      obligations: 0,
      outlays: 0,
      award_types: [],
    };
  }
}

// ============================================
// Spending by State
// ============================================

export async function fetchSpendingByState(fy: number): Promise<StateSpendingItem[]> {
  try {
    const response = await fetch(`${API_BASE}/search/spending_by_geography/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'place_of_performance',
        geo_layer: 'state',
        filters: {
          time_period: [{ start_date: `${fy - 1}-10-01`, end_date: `${fy}-09-30` }],
        },
      }),
    });
    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();

    if (data.results) {
      return data.results.map((r: Record<string, unknown>) => ({
        shape_code: r.shape_code || '',
        display_name: r.display_name || '',
        aggregated_amount: (r.aggregated_amount as number) || 0,
        population: (r.population as number) || 0,
        per_capita: (r.per_capita as number) || 0,
      }));
    }
    return getFallbackStates();
  } catch (error) {
    console.error('Failed to fetch spending by state:', error);
    return getFallbackStates();
  }
}

function getFallbackStates(): StateSpendingItem[] {
  const states = [
    { code: 'CA', name: 'California', amount: 580e9, pop: 39500000 },
    { code: 'TX', name: 'Texas', amount: 420e9, pop: 30000000 },
    { code: 'VA', name: 'Virginia', amount: 310e9, pop: 8640000 },
    { code: 'FL', name: 'Florida', amount: 290e9, pop: 22240000 },
    { code: 'NY', name: 'New York', amount: 270e9, pop: 20200000 },
    { code: 'MD', name: 'Maryland', amount: 200e9, pop: 6180000 },
    { code: 'PA', name: 'Pennsylvania', amount: 180e9, pop: 13000000 },
    { code: 'IL', name: 'Illinois', amount: 150e9, pop: 12800000 },
    { code: 'OH', name: 'Ohio', amount: 140e9, pop: 11800000 },
    { code: 'GA', name: 'Georgia', amount: 130e9, pop: 10800000 },
  ];
  return states.map(s => ({
    shape_code: s.code,
    display_name: s.name,
    aggregated_amount: s.amount,
    population: s.pop,
    per_capita: s.amount / s.pop,
  }));
}

// ============================================
// State Detail
// ============================================

export interface StateDetailData {
  name: string;
  fips: string;
  total_awards: number;
  total_face_value_loan_amount: number;
  population: number;
  per_capita: number;
  award_types: Array<{ type: string; amount: number; count: number }>;
}

export async function fetchStateDetail(fips: string, fy: number): Promise<StateDetailData> {
  try {
    const response = await fetch(`${API_BASE}/recipient/state/${fips}/?year=${fy}`);
    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();

    return {
      name: data.name || fips,
      fips,
      total_awards: data.total_prime_amount || 0,
      total_face_value_loan_amount: data.total_face_value_loan_amount || 0,
      population: data.population || 0,
      per_capita: data.population ? (data.total_prime_amount || 0) / data.population : 0,
      award_types: (data.award_type_counts || []).map((a: Record<string, unknown>) => ({
        type: a.type || '',
        amount: a.amount || 0,
        count: a.count || 0,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch state detail:', error);
    return {
      name: fips,
      fips,
      total_awards: 0,
      total_face_value_loan_amount: 0,
      population: 0,
      per_capita: 0,
      award_types: [],
    };
  }
}

// ============================================
// Search Awards
// ============================================

export async function searchAwards(
  query: string,
  filters?: { awardType?: string; dateRange?: { start: string; end: string } }
): Promise<AwardSearchResult[]> {
  try {
    const filterObj: Record<string, unknown> = {
      keywords: [query],
    };

    // Only include award_type_codes when a specific filter is chosen
    if (filters?.awardType) {
      filterObj.award_type_codes = [filters.awardType];
    }

    const body: Record<string, unknown> = {
      filters: {
        ...filterObj,
        ...(filters?.dateRange ? {
          time_period: [{ start_date: filters.dateRange.start, end_date: filters.dateRange.end }],
        } : {}),
      },
      fields: [
        'Award ID', 'Description', 'Award Amount',
        'Start Date', 'End Date', 'Recipient Name',
        'Awarding Agency', 'Award Type',
      ],
      page: 1,
      limit: 25,
      sort: 'Award Amount',
      order: 'desc',
    };

    const response = await fetch(`${API_BASE}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();

    if (data.results) {
      return data.results.map((r: Record<string, unknown>) => ({
        internal_id: r.generated_internal_id || String(r['Award ID'] || ''),
        Award_ID: (r['Award ID'] as string) || '',
        Description: (r.Description as string) || 'No description',
        Award_Amount: (r['Award Amount'] as number) || 0,
        Start_Date: (r['Start Date'] as string) || '',
        End_Date: (r['End Date'] as string) || '',
        Recipient: (r['Recipient Name'] as string) || 'Unknown',
        Awarding_Agency: (r['Awarding Agency'] as string) || 'Unknown',
        Award_Type: (r['Award Type'] as string) || 'Other',
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to search awards:', error);
    return [];
  }
}

// ============================================
// Spending Over Time (compare years)
// ============================================

export interface SpendingOverTimeItem {
  time_period: { fiscal_year: string; month?: string };
  aggregated_amount: number;
}

export async function fetchSpendingOverTime(years: number[]): Promise<SpendingOverTimeItem[]> {
  try {
    const response = await fetch(`${API_BASE}/search/spending_over_time/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group: 'fiscal_year',
        filters: {
          time_period: years.map(y => ({
            start_date: `${y - 1}-10-01`,
            end_date: `${y}-09-30`,
          })),
        },
      }),
    });

    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch spending over time:', error);
    return [];
  }
}

// ============================================
// Top Contractors
// ============================================

export interface TopContractor {
  name: string;
  amount: number;
}

export async function fetchTopContractors(fy: number): Promise<TopContractor[]> {
  try {
    const response = await fetch(`${API_BASE}/search/spending_by_category/recipient/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [{ start_date: `${fy - 1}-10-01`, end_date: `${fy}-09-30` }],
        },
        limit: 10,
        page: 1,
      }),
    });

    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();

    if (data.results) {
      return data.results.map((r: Record<string, unknown>) => ({
        name: r.name || 'Unknown',
        amount: (r.amount as number) || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch top contractors:', error);
    return [];
  }
}

// ============================================
// Spending by Object Class
// ============================================

export interface ObjectClassSpending {
  name: string;
  amount: number;
}

export async function fetchSpendingByObjectClass(fy: number): Promise<ObjectClassSpending[]> {
  try {
    const response = await fetch(`${API_BASE}/search/spending_by_category/object_class/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [{ start_date: `${fy - 1}-10-01`, end_date: `${fy}-09-30` }],
        },
        limit: 10,
        page: 1,
      }),
    });
    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();
    return (data.results || []).map((r: Record<string, unknown>) => ({
      name: r.name || 'Unknown',
      amount: (r.amount as number) || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch spending by object class:', error);
    return [];
  }
}

// ============================================
// Spending by Month
// ============================================

export interface MonthlySpendingItem {
  month: string;
  amount: number;
}

export async function fetchSpendingByMonth(fy: number): Promise<MonthlySpendingItem[]> {
  try {
    const response = await fetch(`${API_BASE}/search/spending_over_time/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group: 'month',
        filters: {
          time_period: [{ start_date: `${fy - 1}-10-01`, end_date: `${fy}-09-30` }],
        },
      }),
    });
    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();
    return (data.results || []).map((r: Record<string, unknown>) => ({
      month: `${(r.time_period as Record<string, string>)?.fiscal_year || fy}-${(r.time_period as Record<string, string>)?.month || '01'}`,
      amount: (r.aggregated_amount as number) || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch spending by month:', error);
    return [];
  }
}

// ============================================
// New Awards Counts
// ============================================

export interface NewAwardsItem {
  month: string;
  count: number;
}

export async function fetchNewAwardsCounts(fy: number): Promise<NewAwardsItem[]> {
  try {
    const response = await fetch(`${API_BASE}/search/new_awards_over_time/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group: 'month',
        filters: {
          time_period: [{ start_date: `${fy - 1}-10-01`, end_date: `${fy}-09-30` }],
          award_type_codes: ['A', 'B', 'C', 'D'],
        },
      }),
    });
    if (!response.ok) throw new Error(`USAspending API error: ${response.status}`);
    const data = await response.json();
    return (data.results || []).map((r: Record<string, unknown>) => ({
      month: `${(r.time_period as Record<string, string>)?.fiscal_year || fy}-${(r.time_period as Record<string, string>)?.month || '01'}`,
      count: (r.new_award_count_in_period as number) || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch new awards counts:', error);
    return [];
  }
}

// ============================================
// Government "Subscriptions" (local data)
// ============================================

import type { GovernmentSubscription } from '../types';

export function getGovernmentSubscriptions(): GovernmentSubscription[] {
  return [
    { id: 'social_security', name: 'Social Security', icon: '👴', annualCost: 1_380_000_000_000, frequency: 'Annual', trend: 'up', trendAmount: 4.2, description: 'Retirement & disability benefits', category: 'Mandatory' },
    { id: 'medicare', name: 'Medicare', icon: '🏥', annualCost: 848_000_000_000, frequency: 'Annual', trend: 'up', trendAmount: 7.1, description: 'Healthcare for seniors', category: 'Mandatory' },
    { id: 'medicaid', name: 'Medicaid', icon: '💊', annualCost: 616_000_000_000, frequency: 'Annual', trend: 'up', trendAmount: 3.8, description: 'Healthcare for low-income', category: 'Mandatory' },
    { id: 'defense', name: 'Defense Budget', icon: '🛡️', annualCost: 842_000_000_000, frequency: 'Annual', trend: 'up', trendAmount: 3.2, description: 'Military & defense operations', category: 'Discretionary' },
    { id: 'interest', name: 'Interest on Debt', icon: '💳', annualCost: 659_000_000_000, frequency: 'Ongoing', trend: 'up', trendAmount: 23.4, description: 'Payments on national debt', category: 'Mandatory' },
    { id: 'veterans', name: 'Veterans Benefits', icon: '🎖️', annualCost: 301_000_000_000, frequency: 'Annual', trend: 'up', trendAmount: 5.6, description: 'Healthcare & benefits for vets', category: 'Mandatory' },
    { id: 'snap', name: 'SNAP (Food Stamps)', icon: '🍎', annualCost: 127_000_000_000, frequency: 'Annual', trend: 'down', trendAmount: -8.2, description: 'Nutrition assistance', category: 'Mandatory' },
    { id: 'education', name: 'Federal Education', icon: '🎓', annualCost: 238_000_000_000, frequency: 'Annual', trend: 'stable', trendAmount: 0.4, description: 'K-12 & higher ed funding', category: 'Discretionary' },
  ];
}
