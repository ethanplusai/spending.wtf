import type { Workforce } from "../shared/workforce-model.mjs";
export type CompanyYear = {
  year: number;
  periodEnd: string;
  worldwideCash: number | null;
  federalCash: number | null;
  federalCurrentExpense: number | null;
};
export type Company = {
  name: string;
  ticker: string;
  cik: string;
  source: string;
  sourceNote: string;
  periodEnd: string;
  years: CompanyYear[];
  notes: string;
  reviewedAt: string;
  accession: string | null;
  workforce: Workforce | null;
};
export type CorporateData = {
  schemaVersion: string;
  retrievedAt: string;
  coverage: string;
  selection: string;
  companies: Company[];
};
