export type Assumptions = {
  annualTaxablePay: number;
  effectiveRate: number;
  assumedUSShare: number;
  includeAssumedUS: boolean;
};
export type Workforce = {
  global: number;
  us: number | null;
  date: string;
  source: string;
  note: string;
  usDerived: boolean;
  hourlyPayContext?: number;
};
export type WorkforceEstimate = {
  estimatedUSWorkers: number;
  usBasis: string;
  annualTaxablePayroll: number;
  employeeIncomeTax: number;
  low: number;
  high: number;
  workforceDate: string;
  source: string;
  assumptions: Assumptions;
  classification: string;
  sensitivity: string;
};
export function estimateWorkforce(
  company: { workforce: Workforce | null },
  assumptions: Assumptions,
): WorkforceEstimate | null;
