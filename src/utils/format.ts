/**
 * Shared formatting utilities — spending.wtf
 */

export function formatTrillions(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  return (num / 1e9).toFixed(0) + 'B';
}

export function formatBillions(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  return (num / 1e6).toFixed(0) + 'M';
}

export function formatMillions(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  return (num / 1e3).toFixed(0) + 'K';
}

export function formatCurrency(amount: number, compact = true): string {
  if (compact) {
    if (amount >= 1e12) return '$' + (amount / 1e12).toFixed(2) + 'T';
    if (amount >= 1e9) return '$' + (amount / 1e9).toFixed(1) + 'B';
    if (amount >= 1e6) return '$' + (amount / 1e6).toFixed(1) + 'M';
    if (amount >= 1e3) return '$' + (amount / 1e3).toFixed(0) + 'K';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

export function formatDebtLive(num: number): string {
  const trillion = num / 1e12;
  const [whole, decimal] = trillion.toFixed(12).split('.');
  return `${parseInt(whole).toLocaleString()}.${decimal.slice(0, 9)}T`;
}
