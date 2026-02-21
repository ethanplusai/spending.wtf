/**
 * Treasury Fiscal Data API Service
 * Fetches real-time debt & budget data from fiscaldata.treasury.gov
 */

import type { MonthlyBudgetData, RevenueSource } from '../types';

const TREASURY_API_BASE = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2';

export interface DebtData {
  totalDebt: number;
  publicDebt: number;
  intragovernmentalDebt: number;
  recordDate: string;
}

export interface DebtHistoryItem {
  date: string;
  debt: number;
}

/**
 * Fetch the most recent debt to the penny data
 */
export async function fetchCurrentDebt(): Promise<DebtData | null> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/od/debt_to_penny?sort=-record_date&page[size]=1`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const record = data.data[0];
      return {
        totalDebt: parseFloat(record.tot_pub_debt_out_amt),
        publicDebt: parseFloat(record.debt_held_public_amt),
        intragovernmentalDebt: parseFloat(record.intragov_hold_amt),
        recordDate: record.record_date,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch debt data:', error);
    return null;
  }
}

/**
 * Fetch historical debt data for charts
 */
export async function fetchDebtHistory(years: number = 10): Promise<DebtHistoryItem[]> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/od/debt_to_penny?sort=-record_date&page[size]=365&filter=record_date:gte:${new Date().getFullYear() - years}-01-01`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const yearlyData: Record<string, DebtHistoryItem> = {};
      for (const record of data.data) {
        const year = record.record_date.substring(0, 4);
        if (!yearlyData[year]) {
          yearlyData[year] = {
            date: record.record_date,
            debt: parseFloat(record.tot_pub_debt_out_amt),
          };
        }
      }
      return Object.values(yearlyData).sort((a, b) => a.date.localeCompare(b.date));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch debt history:', error);
    return [];
  }
}

/**
 * Fetch monthly budget data (MTS Table 1 equivalent)
 * Revenue and spending for a given fiscal year
 */
export async function fetchMonthlyBudgetData(fy: number): Promise<MonthlyBudgetData> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/mts/mts_table_1?filter=record_fiscal_year:eq:${fy}&sort=record_calendar_month&page[size]=100`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();

    let totalRevenue = 0;
    let totalSpending = 0;
    const revenueByMonth: Array<{ month: number; amount: number }> = [];
    const spendingByMonth: Array<{ month: number; amount: number }> = [];

    if (data.data && data.data.length > 0) {
      for (const record of data.data) {
        const month = parseInt(record.record_calendar_month);
        const classification = record.classification_desc;
        const amount = parseFloat(record.current_month_gross_rcpt_amt || record.current_fytd_rcpt_amt || '0');

        if (classification && classification.toLowerCase().includes('receipt')) {
          totalRevenue += amount;
          revenueByMonth.push({ month, amount });
        }
      }
      // Also get outlays
      for (const record of data.data) {
        const month = parseInt(record.record_calendar_month);
        const amount = parseFloat(record.current_month_outlay_amt || record.current_fytd_outlay_amt || '0');
        if (amount > 0) {
          totalSpending += amount;
          spendingByMonth.push({ month, amount });
        }
      }
    }

    // Fallback to reasonable estimates if API returns weird data
    if (totalRevenue === 0 || totalSpending === 0) {
      return getFallbackBudgetData(fy);
    }

    return {
      fiscalYear: fy,
      totalRevenue,
      totalSpending,
      deficit: totalSpending - totalRevenue,
      revenueByMonth,
      spendingByMonth,
    };
  } catch (error) {
    console.error('Failed to fetch budget data:', error);
    return getFallbackBudgetData(fy);
  }
}

function getFallbackBudgetData(fy: number): MonthlyBudgetData {
  const fallbackMap: Record<number, { revenue: number; spending: number }> = {
    2022: { revenue: 4.90e12, spending: 6.27e12 },
    2023: { revenue: 4.44e12, spending: 6.13e12 },
    2024: { revenue: 4.92e12, spending: 6.75e12 },
    2025: { revenue: 5.05e12, spending: 7.0e12 },
  };
  const d = fallbackMap[fy] || fallbackMap[2025];
  return {
    fiscalYear: fy,
    totalRevenue: d.revenue,
    totalSpending: d.spending,
    deficit: d.spending - d.revenue,
    revenueByMonth: [],
    spendingByMonth: [],
  };
}

/**
 * Fetch revenue breakdown (MTS Table 4 equivalent)
 */
export async function fetchRevenueBreakdown(fy: number): Promise<RevenueSource[]> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/mts/mts_table_4?filter=record_fiscal_year:eq:${fy},sequence_level_number:eq:1&sort=-current_fytd_net_rcpt_amt&page[size]=20`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      let total = 0;
      const sources: Array<{ source: string; amount: number }> = [];

      for (const record of data.data) {
        const amount = Math.abs(parseFloat(record.current_fytd_net_rcpt_amt || '0'));
        if (amount > 0) {
          sources.push({ source: record.classification_desc || 'Other', amount });
          total += amount;
        }
      }

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#0ea5e9', '#d97706', '#525252'];
      return sources.slice(0, 8).map((s, i) => ({
        source: s.source,
        amount: s.amount,
        percent: total > 0 ? (s.amount / total) * 100 : 0,
        color: colors[i % colors.length],
      }));
    }
    return getFallbackRevenue(fy);
  } catch (error) {
    console.error('Failed to fetch revenue breakdown:', error);
    return getFallbackRevenue(fy);
  }
}

function getFallbackRevenue(_fy: number): RevenueSource[] {
  return [
    { source: 'Individual Income Taxes', amount: 2.43e12, percent: 48.1, color: '#3b82f6' },
    { source: 'Social Insurance & Retirement', amount: 1.62e12, percent: 32.1, color: '#10b981' },
    { source: 'Corporate Income Taxes', amount: 420e9, percent: 8.3, color: '#f59e0b' },
    { source: 'Excise Taxes', amount: 100e9, percent: 2.0, color: '#ef4444' },
    { source: 'Customs Duties', amount: 80e9, percent: 1.6, color: '#6b7280' },
    { source: 'Estate & Gift Taxes', amount: 32e9, percent: 0.6, color: '#0ea5e9' },
    { source: 'Other', amount: 371e9, percent: 7.3, color: '#525252' },
  ];
}

/**
 * Fetch spending by department (MTS Table 5 equivalent)
 */
export async function fetchSpendingByDepartment(fy: number): Promise<Array<{ name: string; amount: number }>> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/mts/mts_table_5?filter=record_fiscal_year:eq:${fy},sequence_level_number:eq:1&sort=-current_fytd_outly_amt&page[size]=30`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data
        .filter((r: Record<string, string>) => parseFloat(r.current_fytd_outly_amt || '0') > 0)
        .map((r: Record<string, string>) => ({
          name: r.classification_desc || 'Unknown',
          amount: parseFloat(r.current_fytd_outly_amt || '0'),
        }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch spending by department:', error);
    return [];
  }
}

/**
 * Fetch interest expense data
 */
export async function fetchInterestExpense(): Promise<Array<{ year: number; amount: number }>> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/od/interest_expense?sort=-record_fiscal_year&page[size]=15`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const yearlyData: Record<number, number> = {};
      for (const record of data.data) {
        const year = parseInt(record.record_fiscal_year);
        const amount = parseFloat(record.expense_amt || '0');
        yearlyData[year] = (yearlyData[year] || 0) + amount;
      }
      return Object.entries(yearlyData)
        .map(([year, amount]) => ({ year: parseInt(year), amount }))
        .sort((a, b) => a.year - b.year);
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch interest expense:', error);
    return [];
  }
}

/**
 * Fetch historical debt (back to 1790)
 */
export async function fetchHistoricalDebt(startYear?: number): Promise<DebtHistoryItem[]> {
  try {
    const filter = startYear
      ? `&filter=record_fiscal_year:gte:${startYear}`
      : '';
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/od/debt_outstanding?sort=record_fiscal_year&page[size]=300${filter}`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data.map((r: Record<string, string>) => ({
        date: r.record_fiscal_year || r.record_date,
        debt: parseFloat(r.debt_outstanding_amt || '0'),
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch historical debt:', error);
    return [];
  }
}

/**
 * Fetch daily treasury statement (cash balance)
 */
export async function fetchDailyTreasuryStatement(): Promise<{ date: string; balance: number } | null> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/dts/dts_table_1?sort=-record_date&page[size]=1`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const record = data.data[0];
      return {
        date: record.record_date,
        balance: parseFloat(record.close_today_bal || '0'),
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch daily treasury statement:', error);
    return null;
  }
}

/**
 * Fetch debt to the penny at daily granularity
 */
export async function fetchDebtToThePennyHistory(days: number = 90): Promise<DebtHistoryItem[]> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/od/debt_to_penny?sort=-record_date&page[size]=${days}`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data.map((r: Record<string, string>) => ({
        date: r.record_date,
        debt: parseFloat(r.tot_pub_debt_out_amt || '0'),
      })).reverse();
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch debt to the penny history:', error);
    return [];
  }
}

/**
 * Fetch treasury security types outstanding
 */
export async function fetchTreasurySecurityTypes(): Promise<Array<{ type: string; amount: number }>> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/od/securities_outstanding?sort=-record_date&page[size]=20`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const typeMap = new Map<string, number>();
      for (const record of data.data) {
        const type = record.security_type_desc || 'Unknown';
        const amount = parseFloat(record.outstanding_amt || '0');
        if (!typeMap.has(type) && amount > 0) {
          typeMap.set(type, amount);
        }
      }
      return Array.from(typeMap).map(([type, amount]) => ({ type, amount }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch treasury security types:', error);
    return [];
  }
}

/**
 * Fetch average interest rates on debt
 */
export async function fetchInterestRates(): Promise<Array<{ type: string; rate: number }>> {
  try {
    const response = await fetch(
      `${TREASURY_API_BASE}/accounting/od/avg_interest_rates?sort=-record_date&page[size]=20`
    );
    if (!response.ok) throw new Error(`Treasury API error: ${response.status}`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data.map((r: Record<string, string>) => ({
        type: r.security_desc || 'Unknown',
        rate: parseFloat(r.avg_interest_rate_amt || '0'),
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch interest rates:', error);
    return [];
  }
}
