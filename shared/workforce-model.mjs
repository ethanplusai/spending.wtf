/** Scenario arithmetic, not a tax-return calculator or a statistical confidence model. */
export function estimateWorkforce(company, assumptions) {
  const { annualTaxablePay, effectiveRate, assumedUSShare, includeAssumedUS } =
    assumptions;
  for (const [key, value, max] of [
    ["annualTaxablePay", annualTaxablePay, 1000000],
    ["effectiveRate", effectiveRate, 50],
    ["assumedUSShare", assumedUSShare, 100],
  ])
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > max
    )
      throw Error(`Invalid ${key}`);
  if (typeof includeAssumedUS !== "boolean")
    throw Error("includeAssumedUS must be boolean");
  const w = company.workforce;
  if (!w) return null;
  const known = w.us !== null;
  if (!known && !includeAssumedUS) return null;
  const us = known ? w.us : (w.global * assumedUSShare) / 100;
  const lowUS = known
    ? us
    : (w.global * Math.max(0, assumedUSShare - 15)) / 100;
  const highUS = known
    ? us
    : (w.global * Math.min(100, assumedUSShare + 15)) / 100;
  return {
    estimatedUSWorkers: us,
    usBasis: known
      ? w.usDerived
        ? "Derived from reported approximate US share"
        : "Reported US workforce"
      : "Assumed US share of reported global workforce",
    annualTaxablePayroll: us * annualTaxablePay,
    employeeIncomeTax: (us * annualTaxablePay * effectiveRate) / 100,
    low:
      (lowUS * annualTaxablePay * 0.75 * Math.max(0, effectiveRate - 5)) / 100,
    high:
      (highUS * annualTaxablePay * 1.25 * Math.min(50, effectiveRate + 5)) /
      100,
    workforceDate: w.date,
    source: w.source,
    assumptions: { ...assumptions },
    classification:
      "Illustrative annual employee federal income-tax scenario; not observed payments",
    sensitivity:
      "Low/high stress taxable pay by ±25%, effective rate by ±5 percentage points, and missing US workforce shares by ±15 points. Scenario bounds, not confidence intervals.",
  };
}
