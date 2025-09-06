// LKR formatting helpers for Ceylon Expand

export function formatLKR(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLKRShort(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M LKR`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k LKR`;
  }
  return `${amount} LKR`;
}

export function parseLKR(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}